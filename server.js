/** Server startup for BizTime. */


const { PORT, app } = require("./app");


app.listen(PORT, function () {
  // console.log("Listening on 3000");
  console.log(`${(new Date()).toISOString()}: Server listening on port ${PORT}.`);
});