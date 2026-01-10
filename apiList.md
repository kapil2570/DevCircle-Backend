# DevCircle APIs

## authRouter
- POST /signup
- POST /login
- POST /logout

## profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /profile/password

## connectionRequestsRouter
- POST /request/send/:status/:toUserId
- POST /request/review/:status/:fromUserId

## userDataRouter
- GET /user/connections
- GET /user/receivedRequests
- GET /user/sentRequests
- GET /user/feed