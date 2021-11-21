const Ceramic = require('@ceramicnetwork/http-client').default
const KeyDidResolver = require('key-did-resolver').default;
const ThreeIdResolver = require('@ceramicnetwork/3id-did-resolver').default;
const { Ed25519Provider } = require('key-did-provider-ed25519');
const { TileDocument } = require('@ceramicnetwork/stream-tile');
const modelAliases = require('../../streams.json');
const { FACTORY_CONTRACT } = require("../constants");
const path = require("path");
const DID = require('dids').DID
const { writeFile, readFile } = require('fs').promises

class CeramicsController {
    constructor() {
        this.ceramic;
        this.collectionsListStream;
        this.propositionsMap;
    }

    async init(seed) {
        await this.authenticate(seed);

        const streamInfo = JSON.parse(await readFile(path.resolve(__dirname, './streams.json')));
        console.log(streamInfo);
        if (
            streamInfo.collectionsListStream
            && streamInfo.propositionsMap
        ) {
            const streamId = streamInfo.collectionsListStream;
            const streamIdPropositions = streamInfo.propositionsMap;

            this.collectionsListStream = await TileDocument.load(this.ceramic, streamId)
            this.propositionsMap = await TileDocument.load(this.ceramic, streamIdPropositions)
        } else {
            console.log("Creating Streams ... ");
            await this.createModels();
        }

        console.log("<<< Initial Data 1>>>", this.collectionsListStream?.content?.list);
        console.log("<<< Initial Data 2>>>", this.propositionsMap?.content);
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

        const PropositionMapSchema = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'dyNFT project - Propositions Map',
            type: 'object',
            patternProperties: {
                ".": {
                    type: 'object',
                    patternProperties: {
                        ".": {
                            type: 'array',
                            items: {
                                title: 'Proposition',
                                properties: {
                                    id: {
                                        type: 'string',
                                        title: "NFT id",
                                        maxLength: 100,
                                    },
                                    image: {
                                        "$ref": "#/definitions/imageSources"
                                    },
                                    contract: {
                                        type: 'string',
                                        title: 'Contract Address',
                                        $ref: '#/definitions/ethAddr',
                                    },
                                },
                            }
                        },
                    }
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
                },
                IPFSUrl: {
                    "type": "string",
                    "pattern": "^ipfs://.+",
                    "maxLength": 150
                },
                imageMetadata: {
                    "type": "object",
                    "properties": {
                        "src": {
                            "$ref": "#/definitions/IPFSUrl"
                        },
                        "mimeType": {
                            "type": "string",
                            "maxLength": 50
                        },
                    },
                    "required": ["src", "mimeType"]
                },
                imageSources: {
                    "type": "object",
                    "properties": {
                        "original": {
                            "$ref": "#/definitions/imageMetadata"
                        },
                        "alternatives": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/imageMetadata"
                            }
                        }
                    },
                }
            },
        }

        this.collectionsListStream = await TileDocument.create(this.ceramic, CollectionsListSchema, { pin: true })
        this.propositionsMap = await TileDocument.create(this.ceramic, PropositionMapSchema, { pin: true })

        await writeFile(path.resolve(__dirname, './streams.json'), JSON.stringify({
            collectionsListStream: this.collectionsListStream.id.toString(),
            propositionsMap: this.propositionsMap.id.toString(),
        }))

        await this.seedCollections();
        await this.seedPropositions();

        console.log("state", this.collectionsListStream.id.toString(), this.collectionsListStream.content)
    }

    async seedPropositions() {
        await this.propositionsMap.update({
            [FACTORY_CONTRACT]: {
                "0": [
                    {
                        id: "0",
                        contract: FACTORY_CONTRACT,
                        image: {
                            original: {
                                src: "ipfs://bafybeihjwgphdmd2kuiggtjbp2het3rfhn5wcvhmp4i223ue454llonxfq/7237d93bfb0429d3f0abd5fccf0dff6f.jpg",
                                mimeType: "image/jpg"
                            }
                        }
                    }
                ]
            }
        })
    }

    async seedCollections() {
        await this.collectionsListStream.update({
            list: [
                ...(this.collectionsListStream?.content?.list || []),
                {
                    contract: FACTORY_CONTRACT,
                    title: "Dynamic Collection",
                    description: "dyNFT factory"
                }]
        })
    }


    async addNewCollection({ contract, title, description }) {
        try {
            const newCol = { contract, title, description };

            await this.collectionsListStream.update({
                list: [
                    ...(this.collectionsListStream?.content?.list || []),
                    newCol
                ]
            })
            console.log("Insertion res", this.collectionsListStream?.content?.list);

            return this.collectionsListStream?.content?.list;
        } catch (error) {
            console.log(error);
        }
    }

    async getAllCollections() {
        try {
            const { list } = await this.collectionsListStream.content;

            console.log("list", list);

            return list;
        } catch (error) {
            console.log(error);
        }
    }

    async addNewProposition({ contract, id, image }) {
        try {
            const newProposition = { contract: contract.trim(), id, image: { original: image } };

            console.log("Addinging new propositon with: ", newProposition);

            await this.propositionsMap.update({
                ...(this.propositionsMap?.content || {}),
                [contract]: {
                    ...(this.propositionsMap?.content?.contract || {}),
                    [id]: [
                        ...(this.propositionsMap?.content?.[contract]?.[id] || []),
                        newProposition
                    ]
                }
            })
            console.log("Insertion res propositon", this.propositionsMap?.content);

            return this.propositionsMap?.content;
        } catch (error) {
            console.log(error);
        }
    }

    async deleteProposition({ contract, id, index }) {
        try {
            console.log("Deleting propositon with: ", contract, id, index);

            const arr = (this.propositionsMap?.content?.[contract]?.[id] || []);
            console.log("Deleting propositon arr after: ", arr);
            arr.splice(index, 1);
            console.log("Deleting propositon arr b4: ", arr);

            await this.propositionsMap.update({
                ...(this.propositionsMap?.content || {}),
                [contract]: {
                    ...(this.propositionsMap?.content?.contract || {}),
                    [id]: arr,
                }
            })
            console.log("Deletion res propositon", this.propositionsMap?.content);

            return this.propositionsMap?.content;
        } catch (error) {
            console.log(error);
        }
    }

    async getPropositions({ contract, id }) {
        try {
            const mapObj = await this.propositionsMap.content;

            console.log("mapObj", mapObj);

            const prop = mapObj[contract.trim()][id]

            console.log("prop", prop);

            return prop;
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
