# DevTinder APIs

## authRouter
- POST /signup
- POST /login
- POST /logout

## profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /profile/password

## connectionRequestsRouter
- POST /request/send/interested/:userId
- POST /request/send/ignore/:userId
- POST /request/review/accept/:userId
- POST /request/review/reject/:userId

## userDataRouter
- GET /user/connections
- GET /user/receivedRequests
- GET /user/sentRequests
- GET /user/feed