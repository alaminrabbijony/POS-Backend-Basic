require("dotenv").config();

const { signAccessToken, signRefreshToken, verifyAccess, verifyRefresh, uuidv4 } = require("./utils/tokens");

(async () => {
    const userId = "test-user-id-123";
    const jti = uuidv4()
    const access =signAccessToken({id: userId, role: 'admin', tokenVersion: 0})
    const refresh = signRefreshToken({id: userId, jti, deviceId: 'browser-1'})
   console.log("access:", access);
  console.log("refresh:", refresh);
  console.log("verify access:", verifyAccess(access));
  console.log("verify refresh:", verifyRefresh(refresh));
})();