# fanteam-optimizer-demo
FanTeam Optimizer Tool

## Deployment

Set the `JWT_SECRET` environment variable before starting the server. The
server will refuse to start if this variable is missing. Optionally set
`CLIENT_ORIGIN` to the URL of your frontend to configure CORS.

```bash
export JWT_SECRET=your-secret
npm start
```
