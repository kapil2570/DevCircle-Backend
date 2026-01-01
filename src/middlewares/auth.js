const adminAuth = (req, res, next) => {
    const authToken = "token1";
    const isAuthorizedToken = authToken === "token1";

    if(!isAuthorizedToken) {
        res.status(401).send("Unauthorized Request");
    } else {
        next();
    }
}

const userAuth = (req, res, next) => {
    const authToken = "token2";
    const isAuthorizedToken = authToken === "token2";

    if(!isAuthorizedToken) {
        res.status(401).send("Unauthorized Request");
    } else {
        next();
    }
}

module.exports = { adminAuth, userAuth }