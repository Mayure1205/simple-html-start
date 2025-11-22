// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ForecastLogger {
    struct Log {
        string forecastHash;
        uint256 timestamp;
        uint256 totalSales;
    }

    Log[] public logs;
    mapping(string => bool) public hashExists;
    event ForecastLogged(string indexed forecastHash, uint256 timestamp, uint256 totalSales);

    function logForecast(string memory _forecastHash, uint256 _totalSales) public {
        require(!hashExists[_forecastHash], "This forecast hash has already been logged");
        
        logs.push(Log(_forecastHash, block.timestamp, _totalSales));
        hashExists[_forecastHash] = true;
        emit ForecastLogged(_forecastHash, block.timestamp, _totalSales);
    }

    function getLogCount() public view returns (uint256) {
        return logs.length;
    }
    
    function isHashLogged(string memory _forecastHash) public view returns (bool) {
        return hashExists[_forecastHash];
    }
}
