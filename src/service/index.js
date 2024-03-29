const ceramic = require("./ceramic.js")


const addCollection = async (req, res, next) => {
    const { contract, title, description } = req.body;

    try {
        ceramic.addNewCollection({ contract, title, description });

        res.send();
    } catch (error) {
        console.log(error);
        next();
    }
}

const getAllCollections = async (req, res, next) => {
    const { stackID } = req.body;

    try {
        const collections = await ceramic.getAllCollections();

        res.send(collections);
    } catch (error) {
        console.log(error);
        next();
    }
}

const addProposition = async (req, res, next) => {
    const { contract, id, image } = req.body;

    try {
        ceramic.addNewProposition({ contract, id, image });

        res.send();
    } catch (error) {
        console.log(error);
        next();
    }
}

const deleteProposition = async (req, res, next) => {
    const { contract, id, index } = req.query;

    try {
        ceramic.deleteProposition({ contract, id, index });

        res.send();
    } catch (error) {
        console.log(error);
        next();
    }
}

const getPropositions = async (req, res, next) => {
    const { contract, id } = req.query;
    console.log("getPropositions", { contract, id });

    try {
        const collections = await ceramic.getPropositions({ contract, id });

        res.send(collections);
    } catch (error) {
        console.log(error);
        next();
    }
}

const getServerDID = async function(req, res, next) {
    try {
        const did = await ceramic.getServerDID();

        res.send(did);
    } catch (error) {
        console.log(error);
        next();
    }
}

const getJsonModel = async function(req, res, next) {
    try {
        const model = await ceramic.getJsonModel();

        res.send(model);
    } catch (error) {
        console.log(error);
        next();
    }
}

module.exports = { getAllCollections, addCollection, getServerDID, getJsonModel, getPropositions, addProposition, deleteProposition };
