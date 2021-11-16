const Ceramic = require('@ceramicnetwork/http-client').default
const KeyDidResolver = require('key-did-resolver').default;
const ThreeIdResolver = require('@ceramicnetwork/3id-did-resolver').default;
const { Ed25519Provider } = require('key-did-provider-ed25519');
const { TileDocument } = require('@ceramicnetwork/stream-tile');
const modelAliases = require('../streams.json');
const DID = require('dids').DID
const { writeFile, readFile } = require('fs').promises

class CeramicsController {
    constructor() {
        this.ceramic;
        this.collectionsListStream;
    }

    async init(seed) {
        await this.authenticate(seed);

        const streamInfo = JSON.parse(await readFile('./schema/streams.json'));
        console.log(streamInfo);
        if (streamInfo.collectionsListStream) {
            const streamId = streamInfo.collectionsListStream;

            this.collectionsListStream = await TileDocument.load(this.ceramic, streamId)
        } else {
            console.log("Creating Streams ... ");
            await this.createModels();
        }

        console.log("<<< Initial Data >>>", this.collectionsListStream?.content?.list);
    }

    async authenticate(seed) {
        try {
            const ceramic = this.ceramic = new Ceramic(process.env.CERAMIC_API_URL);

            const did = new DID({
                provider: new Ed25519Provider(seed),
                resolver: {
                    ...ThreeIdResolver.getResolver(ceramic),
                    ...KeyDidResolver.getResolver(),
                },
            })

            await did.authenticate();
            await ceramic.setDID(did);

            console.log('ceramic.did : ', ceramic.did._id);
        } catch (error) {
            console.log("Ceramic Auth Error: ", error);
        }
    }

    async createModels() {
        // const streamIds = await this.ceramic.pin.ls()
        //
        // let count = 0;
        // for await (const id of streamIds) {
        //     count++;
        //     console.log("pin-", id);
        // }
        //
        // console.log("PINS", count, streamIds.toString());

        const CollectionsListSchema = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'dyNFT project - Collections List',
            type: 'object',
            properties: {
                list: {
                    type: 'array',
                    items: {
                        type: 'object',
                        title: 'collectionItem',
                        properties: {
                            title: {
                                type: 'string',
                                title: "Collection's name",
                                maxLength: 100,
                            },
                            description: {
                                type: 'string',
                                title: 'description of the collection',
                            },
                            contract: {
                                type: 'string',
                                title: 'contract address',
                                $ref: '#/definitions/ethAddr',
                            },
                        },
                    },
                },
            },
            definitions: {
                CeramicDocId: {
                    type: 'string',
                    maxLength: 150,
                },
                ethAddr: {
                    type: 'string',
                    pattern: "[a-zA-Z0-9]",
                    maxLength: 1024,
                }
            },
        }

        this.collectionsListStream = await TileDocument.create(this.ceramic, CollectionsListSchema, { pin: true })

        await writeFile('./schema/streams.json', JSON.stringify({
            collectionsListStream: this.collectionsListStream.id.toString()
        }))

        await this.collectionsListStream.update({
            list: [
                ...(this.collectionsListStream?.content?.list || []),
                {
                    contract: "0xtest",
                    title: "hashmasks",
                    description: "adsadsa"
                }]
        })

        console.log("state", this.collectionsListStream.id.toString(), this.collectionsListStream.content)
    }

    async getStream(streamId) {
        console.log("hmm", this.ceramic, streamId);
        const doc = await TileDocument.load(this.ceramic, streamId)

        return doc;
    }

    async addNewCollection({ contract, title, description }) {
        try {
            const res = await this.collectionsListStream.update({
                list: [
                    ...(this.collectionsListStream?.content?.list || []),
                    { contract, title, description }
                ]
            })
            console.log("Insertion res", res);

            return res;

            // const listOfProfils = await this.idx.get('profilListDef');
            //
            // const list = listOfProfils ? listOfProfils.profils : []
            //
            // const recordId = await this.idx.set('profilListDef', {
            //     profils: [{ stackID, ethAddr, protocols }, ...list],
            // });
            //
            // return recordId
        } catch (error) {
            console.log(error);
        }
    }

    async getAllCollections() {
        try {
            const { list } = await this.collectionsListStream.content;

            console.log("list", list);

            return list;
            // const result = [];
            // for (const item of list) {
            //     const { content } = await this.ceramic.loadStream(item.id);
            //     result.push(content);
            // }

            // return result;
        } catch (error) {
            console.log(error);
        }
    }

    getServerDID() {
        return this.ceramic.did._id;
    }

    getJsonModel() {
        return modelAliases;
    }
};

module.exports = new CeramicsController();
