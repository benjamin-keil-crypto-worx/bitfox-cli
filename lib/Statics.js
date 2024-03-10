class Statics {
    static sleepy =() => new Promise((resolve) => setTimeout(resolve, 1000));
    static VOLUME_THRESHOLD = 80;
    static MA_BUFFER_SIZE = 500;
    static MA_10 = 10;
    static MA_20 = 20;
    static MA_50 = 50;
    static MA_100 = 100;
    static MA_200 = 200;
}


module.exports = {Statics: Statics};