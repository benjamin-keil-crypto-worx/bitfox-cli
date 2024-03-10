const args = require('minimist')(process.argv.slice(2));
const colors = require('colors');
const logger = console.log;
let {SocketMapper} = require("./lib/SocketMapper");
let {ComponentFactory} = require("./components/ComponentFactory");
let simpleScreenRunner = require("./simpleScreenRunner");
let dashboarRunner = require("./dashboardRunner");

let isAndroid = false;

if(!args.base && !args.quote && !args.exchange){
  logger(`${"[E]".red} Invalid Usage ! `)
  logger(`${"Usage:".yellow} node index --base=ADA --quote=USDT --exchange=binance --useSocket --timeframe=5m`)
} else {

  let componentFactory = ComponentFactory.getInstance(args);
  isAndroid = componentFactory.isAndroidDashboard();
  if(!isAndroid) {
    let {screen,grid,tradesBox, volume, ticker, indicators, signals} = componentFactory.getDashBoard();
    const Socket = (args.useSocket) ?  SocketMapper.factory(args.exchange) : null;
    let socketClient = (args.useSocket) ? new Socket() : null;
    dashboarRunner.run(args,screen,grid,tradesBox, volume, ticker, indicators, signals, socketClient)

  } else{
    let {screen,grid,androidDashBoard} = componentFactory.getDashBoard();
    const Socket = (args.useSocket) ?  SocketMapper.factory(args.exchange) : null;
    let socketClient = (args.useSocket) ? new Socket() : null;
    simpleScreenRunner.run(args, screen,grid,androidDashBoard, socketClient);
  }

}