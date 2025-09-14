# fanteam-optimizer-demo
FanTeam Optimizer Tool

## Deployment

Set the `JWT_SECRET` environment variable before starting the server. The
server will refuse to start if this variable is missing. Optionally set
`CLIENT_ORIGIN` to the URL of your frontend to enable CORS; if omitted, the
server will reject cross-origin requests.

```bash
export JWT_SECRET=your-secret
# export CLIENT_ORIGIN=http://localhost:5173 # optional
npm start
```
