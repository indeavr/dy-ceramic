# DyNFTs-backend
Back end for the DY NFTs

Frontend repo: [here](https://github.com/indeavr/dy-ui)

## Env file
Create a `.env` file and add this :
```
PORT=8080
CERAMIC_API_URL="https://ceramic-clay.3boxlabs.com"
SEED= ASK INDEAVR
```

## Run server

At the root of the directory run : `npm run server`


## Debugging
Install the [ceramic daemon](https://developers.ceramic.network/build/cli/installation/)

`npm install -g @ceramicnetwork/cli`

`ceramic daemon`

`ceramic show _streamID_`

For more info run
`ceramic state _streamID_`
