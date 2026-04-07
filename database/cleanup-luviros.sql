-- ============================================================
-- Cleanup luviros database
-- Drops all non-LMS objects, keeps LMS schema intact
-- ============================================================

USE luviros;
SET NOCOUNT ON;
PRINT 'Starting cleanup of luviros database...';

-- ============================================================
-- 1. DROP ALL VIEWS
-- ============================================================
PRINT 'Dropping views...';

IF OBJECT_ID('vw_AccountBalances','V')  IS NOT NULL DROP VIEW vw_AccountBalances;
IF OBJECT_ID('vw_exchange','V')         IS NOT NULL DROP VIEW vw_exchange;
IF OBJECT_ID('vw_Journal','V')          IS NOT NULL DROP VIEW vw_Journal;
IF OBJECT_ID('vw_userAccount','V')      IS NOT NULL DROP VIEW vw_userAccount;
IF OBJECT_ID('vwAccount','V')           IS NOT NULL DROP VIEW vwAccount;
IF OBJECT_ID('vwJournalUserAccount','V')IS NOT NULL DROP VIEW vwJournalUserAccount;
IF OBJECT_ID('vwPending','V')           IS NOT NULL DROP VIEW vwPending;
IF OBJECT_ID('vwUserAccount','V')       IS NOT NULL DROP VIEW vwUserAccount;
IF OBJECT_ID('vwUserNoPassword','V')    IS NOT NULL DROP VIEW vwUserNoPassword;

PRINT 'Views dropped.';

-- ============================================================
-- 2. DROP ALL STORED PROCEDURES
-- ============================================================
PRINT 'Dropping stored procedures...';

IF OBJECT_ID('Journal_Save','P')                    IS NOT NULL DROP PROCEDURE Journal_Save;
IF OBJECT_ID('sp_balances','P')                     IS NOT NULL DROP PROCEDURE sp_balances;
IF OBJECT_ID('sp_Deposit','P')                      IS NOT NULL DROP PROCEDURE sp_Deposit;
IF OBJECT_ID('sp_diff','P')                         IS NOT NULL DROP PROCEDURE sp_diff;
IF OBJECT_ID('sp_exchangeLog','P')                  IS NOT NULL DROP PROCEDURE sp_exchangeLog;
IF OBJECT_ID('sp_Interest','P')                     IS NOT NULL DROP PROCEDURE sp_Interest;
IF OBJECT_ID('sp_InterestAutomatic','P')            IS NOT NULL DROP PROCEDURE sp_InterestAutomatic;
IF OBJECT_ID('sp_InterestStats','P')                IS NOT NULL DROP PROCEDURE sp_InterestStats;
IF OBJECT_ID('sp_register','P')                     IS NOT NULL DROP PROCEDURE sp_register;
IF OBJECT_ID('sp_transfer','P')                     IS NOT NULL DROP PROCEDURE sp_transfer;
IF OBJECT_ID('TradeResult_Binance','P')             IS NOT NULL DROP PROCEDURE TradeResult_Binance;
IF OBJECT_ID('TradeResult_External','P')            IS NOT NULL DROP PROCEDURE TradeResult_External;
IF OBJECT_ID('TradeResult_MTI','P')                 IS NOT NULL DROP PROCEDURE TradeResult_MTI;
IF OBJECT_ID('TradeResultPending_Binance','P')      IS NOT NULL DROP PROCEDURE TradeResultPending_Binance;
IF OBJECT_ID('usp_AlgoLog','P')                     IS NOT NULL DROP PROCEDURE usp_AlgoLog;
IF OBJECT_ID('usp_AlgoLog_LastTransaction','P')     IS NOT NULL DROP PROCEDURE usp_AlgoLog_LastTransaction;
IF OBJECT_ID('usp_AlgoLogBTC_LastTransaction','P')  IS NOT NULL DROP PROCEDURE usp_AlgoLogBTC_LastTransaction;
IF OBJECT_ID('usp_AlgoLogBuyBTC','P')               IS NOT NULL DROP PROCEDURE usp_AlgoLogBuyBTC;
IF OBJECT_ID('usp_AlgoLogBuyETH','P')               IS NOT NULL DROP PROCEDURE usp_AlgoLogBuyETH;
IF OBJECT_ID('usp_AlgoLogETH_LastTransaction','P')  IS NOT NULL DROP PROCEDURE usp_AlgoLogETH_LastTransaction;
IF OBJECT_ID('usp_AlgoLogSellBTC','P')              IS NOT NULL DROP PROCEDURE usp_AlgoLogSellBTC;
IF OBJECT_ID('usp_AlgoLogSellETH','P')              IS NOT NULL DROP PROCEDURE usp_AlgoLogSellETH;
IF OBJECT_ID('usp_macd','P')                        IS NOT NULL DROP PROCEDURE usp_macd;
IF OBJECT_ID('usp_tradeLog','P')                    IS NOT NULL DROP PROCEDURE usp_tradeLog;

PRINT 'Stored procedures dropped.';

-- ============================================================
-- 3. DROP ALL FUNCTIONS
-- ============================================================
PRINT 'Dropping functions...';

IF OBJECT_ID('fn_AccountBalances','FN')             IS NOT NULL DROP FUNCTION fn_AccountBalances;
IF OBJECT_ID('fn_AccountBalances','TF')             IS NOT NULL DROP FUNCTION fn_AccountBalances;
IF OBJECT_ID('fn_AccountBinanceOpeningBalance','FN')IS NOT NULL DROP FUNCTION fn_AccountBinanceOpeningBalance;
IF OBJECT_ID('fn_AccountBinanceOpeningBalance','TF')IS NOT NULL DROP FUNCTION fn_AccountBinanceOpeningBalance;
IF OBJECT_ID('fn_AccountChartData','FN')            IS NOT NULL DROP FUNCTION fn_AccountChartData;
IF OBJECT_ID('fn_AccountChartData','TF')            IS NOT NULL DROP FUNCTION fn_AccountChartData;
IF OBJECT_ID('fn_AccountClosingBalance','FN')       IS NOT NULL DROP FUNCTION fn_AccountClosingBalance;
IF OBJECT_ID('fn_AccountClosingBalance','TF')       IS NOT NULL DROP FUNCTION fn_AccountClosingBalance;
IF OBJECT_ID('fn_AccountExternalOpeningBalance','FN') IS NOT NULL DROP FUNCTION fn_AccountExternalOpeningBalance;
IF OBJECT_ID('fn_AccountExternalOpeningBalance','TF') IS NOT NULL DROP FUNCTION fn_AccountExternalOpeningBalance;
IF OBJECT_ID('fn_AccountHistoryByUserAccount','FN') IS NOT NULL DROP FUNCTION fn_AccountHistoryByUserAccount;
IF OBJECT_ID('fn_AccountHistoryByUserAccount','TF') IS NOT NULL DROP FUNCTION fn_AccountHistoryByUserAccount;
IF OBJECT_ID('fn_AccountMovement','FN')             IS NOT NULL DROP FUNCTION fn_AccountMovement;
IF OBJECT_ID('fn_AccountMovement','TF')             IS NOT NULL DROP FUNCTION fn_AccountMovement;
IF OBJECT_ID('fn_AccountMTIOpeningBalance','FN')    IS NOT NULL DROP FUNCTION fn_AccountMTIOpeningBalance;
IF OBJECT_ID('fn_AccountMTIOpeningBalance','TF')    IS NOT NULL DROP FUNCTION fn_AccountMTIOpeningBalance;
IF OBJECT_ID('fn_AccountOpeningBalance','FN')       IS NOT NULL DROP FUNCTION fn_AccountOpeningBalance;
IF OBJECT_ID('fn_AccountOpeningBalance','TF')       IS NOT NULL DROP FUNCTION fn_AccountOpeningBalance;
IF OBJECT_ID('fn_AccountPendingBalance','FN')       IS NOT NULL DROP FUNCTION fn_AccountPendingBalance;
IF OBJECT_ID('fn_AccountPendingBalance','TF')       IS NOT NULL DROP FUNCTION fn_AccountPendingBalance;
IF OBJECT_ID('fn_AccountPerformance','FN')          IS NOT NULL DROP FUNCTION fn_AccountPerformance;
IF OBJECT_ID('fn_AccountPerformance','TF')          IS NOT NULL DROP FUNCTION fn_AccountPerformance;
IF OBJECT_ID('fn_MovementBinance','FN')             IS NOT NULL DROP FUNCTION fn_MovementBinance;
IF OBJECT_ID('fn_MovementBinance','TF')             IS NOT NULL DROP FUNCTION fn_MovementBinance;
IF OBJECT_ID('fn_MovementExternal','FN')            IS NOT NULL DROP FUNCTION fn_MovementExternal;
IF OBJECT_ID('fn_MovementExternal','TF')            IS NOT NULL DROP FUNCTION fn_MovementExternal;
IF OBJECT_ID('fn_parentAccountId','FN')             IS NOT NULL DROP FUNCTION fn_parentAccountId;
IF OBJECT_ID('fn_parentAccountId','TF')             IS NOT NULL DROP FUNCTION fn_parentAccountId;
IF OBJECT_ID('fn_ParentUserId','FN')                IS NOT NULL DROP FUNCTION fn_ParentUserId;
IF OBJECT_ID('fn_ParentUserId','TF')                IS NOT NULL DROP FUNCTION fn_ParentUserId;
IF OBJECT_ID('fn_ReportTradeHistoryBinance','FN')   IS NOT NULL DROP FUNCTION fn_ReportTradeHistoryBinance;
IF OBJECT_ID('fn_ReportTradeHistoryBinance','TF')   IS NOT NULL DROP FUNCTION fn_ReportTradeHistoryBinance;
IF OBJECT_ID('fn_ReportTradeHistoryExternal','FN')  IS NOT NULL DROP FUNCTION fn_ReportTradeHistoryExternal;
IF OBJECT_ID('fn_ReportTradeHistoryExternal','TF')  IS NOT NULL DROP FUNCTION fn_ReportTradeHistoryExternal;
IF OBJECT_ID('fn_ReportTradeHistoryMTI','FN')       IS NOT NULL DROP FUNCTION fn_ReportTradeHistoryMTI;
IF OBJECT_ID('fn_ReportTradeHistoryMTI','TF')       IS NOT NULL DROP FUNCTION fn_ReportTradeHistoryMTI;
IF OBJECT_ID('fn_ReportTradeResultsBinance','FN')   IS NOT NULL DROP FUNCTION fn_ReportTradeResultsBinance;
IF OBJECT_ID('fn_ReportTradeResultsBinance','TF')   IS NOT NULL DROP FUNCTION fn_ReportTradeResultsBinance;
IF OBJECT_ID('fn_ReportTradeResultsExternal','FN')  IS NOT NULL DROP FUNCTION fn_ReportTradeResultsExternal;
IF OBJECT_ID('fn_ReportTradeResultsExternal','TF')  IS NOT NULL DROP FUNCTION fn_ReportTradeResultsExternal;
IF OBJECT_ID('fn_ReportTradeResultsMTI','FN')       IS NOT NULL DROP FUNCTION fn_ReportTradeResultsMTI;
IF OBJECT_ID('fn_ReportTradeResultsMTI','TF')       IS NOT NULL DROP FUNCTION fn_ReportTradeResultsMTI;
IF OBJECT_ID('fn_ReportTrust','FN')                 IS NOT NULL DROP FUNCTION fn_ReportTrust;
IF OBJECT_ID('fn_ReportTrust','TF')                 IS NOT NULL DROP FUNCTION fn_ReportTrust;
IF OBJECT_ID('fn_SpecialCharater','FN')             IS NOT NULL DROP FUNCTION fn_SpecialCharater;
IF OBJECT_ID('fn_SpecialCharater','TF')             IS NOT NULL DROP FUNCTION fn_SpecialCharater;
IF OBJECT_ID('fn_TradeResults','FN')                IS NOT NULL DROP FUNCTION fn_TradeResults;
IF OBJECT_ID('fn_TradeResults','TF')                IS NOT NULL DROP FUNCTION fn_TradeResults;
IF OBJECT_ID('fnSplitString','FN')                  IS NOT NULL DROP FUNCTION fnSplitString;
IF OBJECT_ID('fnSplitString','TF')                  IS NOT NULL DROP FUNCTION fnSplitString;

PRINT 'Functions dropped.';

-- ============================================================
-- 4. DROP ALL FOREIGN KEY CONSTRAINTS ON NON-LMS TABLES
-- ============================================================
PRINT 'Dropping foreign key constraints...';

DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_NAME(parent_object_id))
             + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys
WHERE OBJECT_NAME(parent_object_id) NOT IN (
    'Users','Courses','Modules','Lessons','Tests','Questions','Answers','UserProgresses','TestResults'
);

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;

PRINT 'Foreign key constraints dropped.';

-- ============================================================
-- 5. DROP ALL NON-LMS TABLES
-- ============================================================
PRINT 'Dropping non-LMS tables...';

IF OBJECT_ID('TradeLog','U')        IS NOT NULL DROP TABLE TradeLog;
IF OBJECT_ID('TradeLogETH','U')     IS NOT NULL DROP TABLE TradeLogETH;
IF OBJECT_ID('TradeETH','U')        IS NOT NULL DROP TABLE TradeETH;
IF OBJECT_ID('TradeSplit','U')      IS NOT NULL DROP TABLE TradeSplit;
IF OBJECT_ID('Trading','U')         IS NOT NULL DROP TABLE Trading;
IF OBJECT_ID('TradingETH','U')      IS NOT NULL DROP TABLE TradingETH;
IF OBJECT_ID('TradeResult','U')     IS NOT NULL DROP TABLE TradeResult;
IF OBJECT_ID('BuySellBTC','U')      IS NOT NULL DROP TABLE BuySellBTC;
IF OBJECT_ID('BuySellETH','U')      IS NOT NULL DROP TABLE BuySellETH;
IF OBJECT_ID('AlgoLogBTC','U')      IS NOT NULL DROP TABLE AlgoLogBTC;
IF OBJECT_ID('AlgoLogETH','U')      IS NOT NULL DROP TABLE AlgoLogETH;
IF OBJECT_ID('LogBTC','U')          IS NOT NULL DROP TABLE LogBTC;
IF OBJECT_ID('LogMA','U')           IS NOT NULL DROP TABLE LogMA;
IF OBJECT_ID('LogStoch','U')        IS NOT NULL DROP TABLE LogStoch;
IF OBJECT_ID('macdETH','U')         IS NOT NULL DROP TABLE macdETH;
IF OBJECT_ID('balanceBTC','U')      IS NOT NULL DROP TABLE balanceBTC;
IF OBJECT_ID('bb','U')              IS NOT NULL DROP TABLE bb;
IF OBJECT_ID('btcData','U')         IS NOT NULL DROP TABLE btcData;
IF OBJECT_ID('ichimoku','U')        IS NOT NULL DROP TABLE ichimoku;
IF OBJECT_ID('coinData','U')        IS NOT NULL DROP TABLE coinData;
IF OBJECT_ID('coin','U')            IS NOT NULL DROP TABLE coin;
IF OBJECT_ID('ExchangeLog','U')     IS NOT NULL DROP TABLE ExchangeLog;
IF OBJECT_ID('ExchangeRate','U')    IS NOT NULL DROP TABLE ExchangeRate;
IF OBJECT_ID('exchangeData','U')    IS NOT NULL DROP TABLE exchangeData;
IF OBJECT_ID('exchange','U')        IS NOT NULL DROP TABLE exchange;
IF OBJECT_ID('Journal','U')         IS NOT NULL DROP TABLE Journal;
IF OBJECT_ID('AccountBinance','U')  IS NOT NULL DROP TABLE AccountBinance;
IF OBJECT_ID('AccountExternal','U') IS NOT NULL DROP TABLE AccountExternal;
IF OBJECT_ID('AccountMTI','U')      IS NOT NULL DROP TABLE AccountMTI;
IF OBJECT_ID('Account','U')         IS NOT NULL DROP TABLE Account;
IF OBJECT_ID('AccountType','U')     IS NOT NULL DROP TABLE AccountType;
IF OBJECT_ID('UserToken','U')       IS NOT NULL DROP TABLE UserToken;
IF OBJECT_ID('[User]','U')          IS NOT NULL DROP TABLE [User];
IF OBJECT_ID('Role','U')            IS NOT NULL DROP TABLE Role;
IF OBJECT_ID('Status','U')          IS NOT NULL DROP TABLE Status;
IF OBJECT_ID('TransactionType','U') IS NOT NULL DROP TABLE TransactionType;
IF OBJECT_ID('Currency','U')        IS NOT NULL DROP TABLE Currency;
IF OBJECT_ID('mti','U')             IS NOT NULL DROP TABLE mti;

PRINT 'Non-LMS tables dropped.';

-- ============================================================
-- 6. VERIFY — show what remains
-- ============================================================
PRINT 'Remaining objects:';

SELECT 'TABLE' AS type, TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'
UNION ALL
SELECT 'VIEW', TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS
UNION ALL
SELECT 'PROC', ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE='PROCEDURE'
UNION ALL
SELECT 'FUNC', ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE='FUNCTION'
ORDER BY type, name;

PRINT 'Cleanup complete.';
