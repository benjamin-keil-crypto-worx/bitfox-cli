const contrib = require('blessed-contrib');
const blessed = require('blessed');

class ComponentFactory {

    static getInstance(args) {
        return new ComponentFactory(args);
    }

    constructor(args) {
        this.screen = blessed.screen()
        this.grid = (args.android) ? new contrib.grid({
            rows: 12,
            cols: 12,
            screen:  this.screen
        }) : new contrib.grid({
            rows: 12,
            cols: 8,
            screen:  this.screen
        });
        this.tradesBox = null;
        this.volume = null;
        this.ticker = null;
        this.indicators = null;
        this.signals = null;
        this.isAndroid = args.android;
        this.androidDashBoard = null;
        if (args.android) {
            this.setUpAndroidDashBoard(args)
        } else {
            this.setUpDashBoard(args)
        }
    }

    isAndroidDashboard(){ return this.isAndroid;}
    
    getDashBoard() {
        if (this.isAndroid) {
            return {
                screen: this.screen,
                grid: this.grid,
                androidDashBoard:this.androidDashBoard
            }
        }
        return {
            screen: this.screen,
            grid: this.grid,
            tradesBox: this.tradesBox,
            volume: this.volume,
            ticker: this.ticker,
            indicators: this.indicators,
            signals: this.signals
        }
    }
    setUpAndroidDashBoard(args) {
        this.androidDashBoard = this.grid.set(0, 0, 12, 12, contrib.log, {
            fg: "green",
            selectedFg: "green",
            label: `${args.base}/${args.quote} ${args.exchange} Dashboard`
        })
    }
    setUpDashBoard(args) {
        this.tradesBox = this.grid.set(0, 0, 12, 2, contrib.log, {
            fg: "green",
            selectedFg: "green",
            label: `${args.base}/${args.quote} Trades`
        })

        this.volume = this.grid.set(0, 2, 4, 3, contrib.donut, {
            label: 'Volume',
            radius: 16,
            arcWidth: 4,
            yPadding: 2,
            data: [{
                label: 'Volume',
                percent: 0
            }]
        })

        this.ticker = this.grid.set(0, 5, 4, 3, contrib.lcd, {
            label: "Ticker",
            segmentWidth: 0.06,
            segmentInterval: 0.11,
            strokeWidth: 0.1,
            elements: 8,
            display: 0,
            elementSpacing: 4,
            elementPadding: 2
        });

        this.indicators = this.grid.set(4, 2, 8, 3, contrib.log, {
            fg: "green",
            selectedFg: "green",
            label: 'Daily Indicator(s)'
        });

        this.signals = this.grid.set(4, 5, 8, 3, contrib.log, {
            fg: "green",
            selectedFg: "green",
            label: 'Signals'
        })
    }
}

module.exports = {
    ComponentFactory: ComponentFactory
};