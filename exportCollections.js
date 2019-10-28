const AWS = require('aws-sdk');
AWS.config.loadFromPath('./credentials/config.json');

const s3 = new AWS.S3({apiVersion: "2006-03-01"});
const rekognition = new AWS.Rekognition();
const fs = require('fs');

console.log('Starting function');
let JSONFile = {}
JSONFile.data = []


//_______________________________________________________________________

const getCollections = async () => {
    const collectionData = await rekognition.listCollections().promise();
    const collections = collectionData.CollectionIds;

    collections.map(async collection => {
        if (collection !== 'allFaces' && collection !== 'biz2click') {
            const eiidAll = await listEiids(collection);

            jsonWriter(collection, eiidAll);
        }
    })
};

const listEiids = async (collection) => {
    const listParams = {
        CollectionId: collection,
        MaxResults: 4096
    };
    const eiids = []
    const faceData = await rekognition.listFaces(listParams).promise();
    let faces = faceData.Faces;

    for (let i=0; i<faces.length; i++) {
        let eiid = faces[i].ExternalImageId;
        let eiidFinal = keySlice(eiid, 7);
        eiids.push({
            "eiid": eiidFinal
        });
    }
    return eiids;
}

function jsonWriter(collection, allEiids) {
    let body = [
        {
            [collection]: allEiids
        }
    ];

    JSONFile.data.push(...body);
    let json = JSON.stringify(JSONFile, null, '\t')
    fs.writeFile('collectionData.json', json, 'utf8', function(err) {
        if (err) throw err;
        console.log('complete');
    });
}

//_______________________________________________________________________

function keySlice(key, firstIndex, lastIndex) {
    let rawKey = key.slice(firstIndex, lastIndex);
    return rawKey;
}

//_______________________________________________________________________

module.exports.getCollections = getCollections;