let Statics = require("./lib/Statics");
let {VolumeBasedSupportAndResistance} = require("./lib/VolumeBasedSupportAndResistance");
let {DataLoaderBuilder,Strategy, utils} = require("bitfox").bitfox;
let helpers = require("./lib/helpers");
const ccxt = require("ccxt");

let tickerPrices = [];
let lastTickerInfo = 0;
let currentDate = new Date();
let volumeBasedSupportAndResistance =VolumeBasedSupportAndResistance.factory();
module.exports.run = async (args,screen,grid,tradesBox, volume, ticker, indicators, signals, socketClient) =>{
  
setInterval(async () =>{

    let dataLoader = DataLoaderBuilder()
        .setExchangeName(args.exchange)
        .setPollRate(1)
        .setRequiredCandles(200)
        .setStorage()
        .setSymbol(`${args.base}${args.quote}`)
        .setTimeFrame(args.timeframe || "5m")
        .setVerbose(false)
        .build();

    await dataLoader.setUpClient()
    let data = await dataLoader.load();
    let { o,h,l,c,v, buffer } = utils.createIndicatorData(data);
    let fastEMa = Strategy.INDICATORS["EMAIndicator"].getData(o,h,l,c,v,{period:200},buffer);
    let slowEMa = Strategy.INDICATORS["EMAIndicator"].getData(o,h,l,c,v,{period:55},buffer);
    let fastMa = Strategy.INDICATORS["SmaIndicator"].getData(o,h,l,c,v,{period:200},buffer);
    let slowMa = Strategy.INDICATORS["SmaIndicator"].getData(o,h,l,c,v,{period:55},buffer);
    let rsi = Strategy.INDICATORS["RsiIndicator"].getData(o,h,l,c,v,{},buffer);
    let st = Strategy.INDICATORS.SuperTrendIndicator.getData(o,h,l,c,v,{},buffer);
    indicators.log(`${"[ Fast EMA    ]".blue} ${fastEMa[fastEMa.length-1]} ${"[ Slow EMA ]".yellow} ${slowEMa[slowEMa.length-1]}`);
    indicators.log(`${"[ Fast MA     ]".blue} ${fastMa[fastMa.length-1]} ${"[ Slow MA  ]".yellow} ${slowMa[slowMa.length-1]}`);
    indicators.log(`${"[   RSI       ]".cyan} ${rsi[rsi.length-1]}`);
    let col = st[st.length-1].trend === "long" ? "green" : "red";
    if(col === "green"){
        indicators.log(`${"[ Super Trend ]".green} ${st[st.length-1].trend} @ ${st[st.length-1].value}`);
    } else{
        indicators.log(`${"[ Super Trend ]".red} ${st[st.length-1].trend} @ ${st[st.length-1].value}`);
    }

  }, 30000)


  if(args.useSocket) {
    // market could be from CCXT or genearted by the user
    const market = {
      id: args.base + args.quote, // remote_id used by the exchange
      base: args.base, // standardized base symbol for Bitcoin
      quote: args.quote, // standardized quote symbol for Tether
    };

    socketClient.on("error", err => signals.log("Error in Connection"));
    // handle trade events
    socketClient.on("trade", trade => {
      let price = Number(trade.price).toFixed(4);
      let amount = Number(trade.amount).toFixed(4);
      (trade.side === "sell") ? tradesBox.log(`${price} @ ${amount} ⬇`.red) : tradesBox.log(`${price} @ ${amount} ⬆`.green);
      

    });
    // handle level2 orderbook snapshots
    socketClient.on("l2snapshot", snapshot => {
      volumeBasedSupportAndResistance.setResistance(helpers.getHighestVolumeInOrderBook(snapshot.asks));
      volumeBasedSupportAndResistance.setSupport(helpers.getHighestVolumeInOrderBook(snapshot.bids));

      let askSum = snapshot.asks.reduce((accumulator, currentValue) => {
        // Check if the current object has the 'size' key
        if ('size' in currentValue) {
          // Add the value of 'size' to the accumulator
          return accumulator + Number(currentValue.size);
        } else {
          // If the 'size' key is not present, return accumulator unchanged
          return accumulator;
        }
      }, 0);

      let bidSum = snapshot.bids.reduce((accumulator, currentValue) => {
        // Check if the current object has the 'size' key
        if ('size' in currentValue) {
          // Add the value of 'size' to the accumulator
          return accumulator + Number(currentValue.size);
        } else {
          // If the 'size' key is not present, return accumulator unchanged
          return accumulator;
        }
      }, 0);

      let color = askSum > bidSum ? "red" : "green";
      let sum = askSum + bidSum;
      let pct = (color === "green") ? bidSum / sum : askSum / sum;
      let label = (color === "green") ? `Buyer Dominance` : `Seller Dominace`
      volume.setData([
        {percent: parseFloat(pct * 100).toFixed(2), label: label, 'color': color}
      ]);
      if((pct * 100) > Statics.VOLUME_THRESHOLD){
        let message = (color === "green") ? `[ Buy  ]`.green : `[ Sell ]`.red;
        signals.log(`${message} @ ${lastTickerInfo}   volume % ${pct*100}`);
      }
      screen.render();
    });

    socketClient.on("ticker", tickerData => {
      ticker.setDisplay(Number(tickerData.last).toFixed(4));
      ticker.setOptions({
        color: tickerData.last >= lastTickerInfo ? "green" : "red",
        elementPadding: 2
      });
      screen.render();
      lastTickerInfo = tickerData.last;
      tickerPrices.push(Number(tickerData.last));
      if(tickerPrices.length > Statics.MA_BUFFER_SIZE){
        tickerPrices.shift();
      }
    });

    // subscribe to trades
    socketClient.subscribeTrades(market);

    // subscribe to ticker 
    socketClient.subscribeTicker(market);

    // subscribe to level2 orderbook snapshots
    socketClient.subscribeLevel2Snapshots(market);
    
  }
  else {
    const useCcxtClient = async () => {
    

      try{
        let client = new ccxt[args.exchange]();
        client.options =args.options || {'adjustForTimeDifference': true,'recvWindow':7000 ,rateLimit: 1000};
        await client.loadTimeDifference()
        await client.loadMarkets();
        
        setInterval(async () =>{
          let trades = await client.fetchTrades(`${args.base}${args.quote}`)
          await utils.sleepy();
          let ob = await client.fetchOrderBook(`${args.base}${args.quote}`)
          await utils.sleepy();
          let tickerData = await client.fetchTicker(`${args.base}${args.quote}`)
          tickerPrices.push(tickerData.last);
          if(tickerPrices.length > Statics.MA_BUFFER_SIZE){
            tickerPrices.shift();
          }
          ticker.setDisplay(Number(tickerData.last).toFixed(4));
          ticker.setOptions({
            color: tickerData.last >= lastTickerInfo ? "green" : "red",
            elementPadding: 2
          });
         
          volumeBasedSupportAndResistance.setResistance(helpers.getHighestVolumeInOrderBookForClient(ob.asks));
          volumeBasedSupportAndResistance.setSupport(helpers.getHighestVolumeInOrderBookForClient(ob.bids));
          
          const bidSum = ob.bids.reduce((total, [_, secondIndex]) => total + secondIndex, 0);
          const askSum = ob.asks.reduce((total, [_, secondIndex]) => total + secondIndex, 0);
          let col = askSum > bidSum ? "red" : "green";
          let sum = askSum + bidSum;
          let pct = (col === "green") ? bidSum / sum : askSum / sum;
          let label = (col === "green") ? `Buyer Dominance` : `Seller Dominace`
          volume.setData([
            {percent: parseFloat(pct * 100).toFixed(2), label: label, 'color': col}
          ]);
          
          if((pct * 100) > Statics.VOLUME_THRESHOLD){
            let message = (col === "green") ? `[ Buy  ]`.green : `[ Sell ]`.red;
            signals.log(`${message} @ ${tickerData.last}   volume % ${pct*100}`);
          }
          trades.forEach(tr => {
            let price = Number(tr.price).toFixed(4);
            let amount = Number(tr.amount).toFixed(4);
            (tr.side === "sell") ? tradesBox.log(`${price} @ ${amount} ⬇`.red) : tradesBox.log(`${price} @ ${amount} ⬆`.green);
          })
          screen.render();
          lastTickerInfo = tickerData.last;
        }, 1000);
        
      } catch (e) {
        logger(e);
        process.exit(1);
      }
    }
    useCcxtClient();
    
  }

  screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
  });

  // fixes https://github.com/yaronn/blessed-contrib/issues/10
  screen.on('resize', function () {
    indicators.emit('attach');
    signals.emit('attach');
    ticker.emit('attach');
    volume.emit('attach');
    tradesBox.emit('attach');
  });
  
  screen.render()
}