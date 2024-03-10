let Statics = require("./lib/Statics");
let {VolumeBasedSupportAndResistance} = require("./lib/VolumeBasedSupportAndResistance");
let {DataLoaderBuilder,Strategy, utils} = require("bitfox").bitfox;
let helpers = require("./lib/helpers");
const ccxt = require("ccxt");

let currentOrderbook = null;

let tickerPrices = [];
let trades = [];
let lastTickerInfo = 0;
let currentDate = new Date();
let volumeBasedSupportAndResistance =VolumeBasedSupportAndResistance.factory();

const printLastenTickers = (component) => {
  component.log("[   Trades    ]".yellow)
  if(trades.length > 0) {
    trades.forEach(tr => {
      let price = Number(tr.price).toFixed(4);
      let amount = Number(tr.amount).toFixed(4);
      (tr.side === "sell") ? component.log(`${price} @ ${amount} ⬇`.red) : component.log(`${price} @ ${amount} ⬆`.green);
    })
  } else{
    component.log(`[     N/A     ]`)
  }
  
};
const getBuyVsSellVolume =(component) =>{
    component.log("[   Volume    ]".yellow)
    if(currentOrderbook != null){
        volumeBasedSupportAndResistance.setResistance(helpers.getHighestVolumeInOrderBookForClient(currentOrderbook.asks));
        volumeBasedSupportAndResistance.setSupport(helpers.getHighestVolumeInOrderBookForClient(currentOrderbook.bids));
              
        const bidSum = currentOrderbook.bids.reduce((total, [_, secondIndex]) => total + secondIndex, 0);
        const askSum = currentOrderbook.asks.reduce((total, [_, secondIndex]) => total + secondIndex, 0);
        let sum = askSum + bidSum;
        component.log(`${"[   Buyers    ]".green} @ ${((bidSum / sum)*100).toFixed(0)} %`)
        component.log(`${"[   Sellers   ]".red} @ ${((askSum / sum)*100).toFixed(0)} %`)
    } else{
        component.log(`[     N/A     ]`)
    }
    
    
}
module.exports.run = async (args, screen,grid,androidDashBoard, socketClient) =>{

    setInterval(async () =>{
        let client = new ccxt[args.exchange]();
        client.options =args.options || {'adjustForTimeDifference': true,'recvWindow':7000 ,rateLimit: 1000};
        await client.loadTimeDifference()
        await client.loadMarkets();
        let ob = await client.fetchOrderBook(`${args.base}${args.quote}`);
        currentOrderbook = ob;
        await utils.sleepy();
        let tickerData = await client.fetchTicker(`${args.base}${args.quote}`)
        tickerPrices.push(tickerData.last);
        if(tickerPrices.length > Statics.MA_BUFFER_SIZE){
          tickerPrices.shift();
        }
        androidDashBoard.log(`${"[    Ticker   ]".yellow} ${args.base}${args.quote} ${args.exchange} @ ${tickerData.last}`);
        trades = await client.fetchTrades(`${args.base}${args.quote}`)
        await utils.sleepy();

        let dataLoader = DataLoaderBuilder()
            .setExchangeName(args.exchange)
            .setPollRate(2)
            .setRequiredCandles(200)
            .setStorage()
            .setSymbol(`${args.base}${args.quote}`)
            .setTimeFrame(args.timeframe || "5m")
            .setVerbose(false)
            .build();
    
        await dataLoader.setUpClient()
        let data = await dataLoader.load();
        let { o,h,l,c,v, buffer } = utils.createIndicatorData(data);
        let fastEMa = Strategy.INDICATORS["EMAIndicator"].getData(o,h,l,c,v,{period:55},buffer);
        let slowEMa = Strategy.INDICATORS["EMAIndicator"].getData(o,h,l,c,v,{period:200},buffer);
        let rsi = Strategy.INDICATORS["RsiIndicator"].getData(o,h,l,c,v,{},buffer);
        let st = Strategy.INDICATORS.SuperTrendIndicator.getData(o,h,l,c,v,{},buffer);
        androidDashBoard.log(`${"[ Fast EMA    ]".blue} ${fastEMa[fastEMa.length-1]}`);
        androidDashBoard.log(`${"[ Slow EMA    ]".yellow} ${slowEMa[slowEMa.length-1]}`)
        androidDashBoard.log(`${"[   RSI       ]".cyan} ${rsi[rsi.length-1]}`);
        let col = st[st.length-1].trend === "long" ? "green" : "red";
        if(col === "green"){
            androidDashBoard.log(`${"[ Super Trend ]".green} ${st[st.length-1].trend} @ ${st[st.length-1].value}`);
        } else{
            androidDashBoard.log(`${"[ Super Trend ]".red} ${st[st.length-1].trend} @ ${st[st.length-1].value}`);
        }

        
      }, 30000)


     

      screen.key(['escape', 'q', 'C-c', 'b', 's', 'v', 't' , ''  ], function (ch, key) {
        if (key.name.toLowerCase() === 'v') {
            getBuyVsSellVolume(androidDashBoard);
            screen.render();
          } else if (key.name.toLowerCase() === 's') {
            androidDashBoard.log('You pressed S');
            screen.render();
          } else if (key.name.toLowerCase() === 't') {
            printLastenTickers(androidDashBoard);
            screen.render();
          } else {
            return process.exit(0);
          }
      });
    
      // fixes https://github.com/yaronn/blessed-contrib/issues/10
      screen.on('resize', function () {
        androidDashBoard.emit('attach');
      });
      
      screen.render()

}