module.exports.getHighestVolumeInOrderBookForClient = (ob) => {
    // Initialize variables to keep track of the maximum size and its index
    let maxIndex = 0;
    let targetPrice = ob[0][0]; // Assuming the first element has the maximum size initially
    let maxSize = ob[0][1];
    // Iterate through the array starting from the second element
    let len = ob.length;
    for (let i = 1; i < len; i++) {
      // Compare the size of the current element with the maximum size found so far
      if (ob[i][1] > maxSize) {
        // If the current element has a greater size, update maxSize and maxIndex
        maxSize = ob[i][1];
        targetPrice = ob[i][0];
      }
    }
    return { targetPrice: targetPrice, maxSize: maxSize};
}
  
module.exports.getHighestVolumeInOrderBook = (ob) => {
    // Initialize variables to keep track of the maximum size and its index
    let maxIndex = 0;
    let targetPrice = ob[0].price; // Assuming the first element has the maximum size initially
    let maxSize = ob[0].size;
    // Iterate through the array starting from the second element
    let len = ob.length;
    for (let i = 1; i < len; i++) {
      // Compare the size of the current element with the maximum size found so far
      if (ob[i].size > maxSize) {
        // If the current element has a greater size, update maxSize and maxIndex
        maxSize = ob[i].size;
        targetPrice = ob[i].price;
      }
    }
    return { targetPrice: targetPrice, maxSize: maxSize};
}
  