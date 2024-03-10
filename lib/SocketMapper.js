const socket = require('ccxws');
class SocketMapper {

    static factory(exchange){
      switch(exchange.toLowerCase()){
  
        case "bibox"     :   return socket.BiboxClient;
        case "binance"   :   return socket.BinanceClient;
        case "bitfinex"  :   return socket.BitfinexClient;
        case "bitflyer"  :   return socket.BitflyerClient;
        case "bithumb"   :   return socket.BithumbClient;
        case "bitmex"    :   return socket.BitmexClient;
        case "bitstamp"  :   return socket.BitstampClient;
        case "bittrex"   :   return socket.BittrexClient;
        case "cex.io"    :   return socket.CexClient;
        case "coinbase"  :   return socket.CoinbaseProClient;
        case "coinex"    :   return socket.CoinexClient;
        case "deribit"   :   return socket.DeribitClient;
        case "digifinex" :   return socket.DigifinexClient;
        case "erisX"     :   return socket.ErisXClient;
        case "gemini"    :   return socket.GeminiClient;
        case "hitBTC"    :   return socket.HitBtcClient;
        case "huobi"     :   return socket.HuobiClient;
        case "kucoin"    :   return socket.KucoinClient;
        case "kraken"    :   return socket.KrakenClient;
        case "poloniex"  :   return socket.PoloniexClient;
        case "upbit"     :   return socket.UpbitClient;
        case "xb"        :   return socket.ZbClient;
        default: return socket.BinanceClient;
      }
    }
  }
  module.exports = {SocketMapper: SocketMapper}