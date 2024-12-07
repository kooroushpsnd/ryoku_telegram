const bitcoin = require('bitcoinjs-lib')

function isValidTronAddress(address) {
    const tronRegex = /^T[a-zA-Z0-9]{33}$/;
    return tronRegex.test(address);
}

function isValidEthereumAddress(address) {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
}

function isValidBitcoinAddress(address) {
    try {
        bitcoin.address.toOutputScript(address); 
        return true;
    } catch (e) {
        return false;
    }
}

function isValidDogecoinAddress(address){
    const dogeRegex = /^[DA9][a-zA-Z0-9]{25,34}$/;
    return dogeRegex.test(address);
}

function isValidTonAddress(address) {
    const tonRegex = /^[kEQ][A-Za-z0-9_-]{47}$/;
    if (tonRegex.test(address)) {
        return true;
    }

    const hexRegex = /^[0-9a-fA-F]{64}$/;
    return hexRegex.test(address);
}


module.exports = {
    isValidTronAddress,
    isValidEthereumAddress,
    isValidBitcoinAddress,
    isValidDogecoinAddress,
    isValidTonAddress
};
