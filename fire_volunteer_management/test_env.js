// 測試環境變數讀取
console.log("ENABLE_TEST_LOGIN:", process.env.ENABLE_TEST_LOGIN);
console.log("Type:", typeof process.env.ENABLE_TEST_LOGIN);
console.log("Comparison result:", process.env.ENABLE_TEST_LOGIN === "true");
console.log("Raw value:", JSON.stringify(process.env.ENABLE_TEST_LOGIN));
