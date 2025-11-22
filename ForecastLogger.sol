// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ForecastLogger {
    struct Log {
        string forecastHash;
        uint256 timestamp;
        uint256 totalSales;
    }

    Log[] public logs;
    event ForecastLogged(string indexed forecastHash, uint256 timestamp, uint256 totalSales);

    function logForecast(string memory _forecastHash, uint256 _totalSales) public {
        logs.push(Log(_forecastHash, block.timestamp, _totalSales));
        emit ForecastLogged(_forecastHash, block.timestamp, _totalSales);
    }

    function getLogCount() public view returns (uint256) {
        return logs.length;
    }
}
