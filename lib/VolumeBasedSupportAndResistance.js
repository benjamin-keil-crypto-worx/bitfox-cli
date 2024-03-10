class VolumeBasedSupportAndResistance {
    static factory  () { return new VolumeBasedSupportAndResistance(); }
    constructor () {
      this.supportVolumeSize = 0;
      this.supportTargetPrice =0;
      this.resistanceVolumeSize = 0;
      this.resistanceTargetPrice = 0;
    }
  
    setSupport(support){
      this.supportVolumeSize = support.maxSize;
      this.supportTargetPrice = support.targetPrice;
      return this;
    }
  
    setResistance(resistance){
      this.resistanceVolumeSize = resistance.maxSize;
      this.resistanceTargetPrice = resistance.targetPrice;
      return this;
    }
  
    getSupport(){ return {price:this.supportTargetPrice,volume:this.supportVolumeSize}}
    getResistance(){ return {price:this.resistanceTargetPrice,volume:this.resistanceVolumeSize}}
  
  }

  module.exports = {VolumeBasedSupportAndResistance:VolumeBasedSupportAndResistance}