const AWS = require('aws-sdk');
AWS.config.loadFromPath('./credentials/config.json');

const rekognition = new AWS.Rekognition();
const inquirer = require('inquirer');
const collections = require('./exportCollections');

const questionsStage1 = [
    {
        type: 'rawlist',
        name: 'introduction',
        message: 'What would you like to do first?',
        choices: [
            'Count the Collections',
            'Extract Collections with ExternalImageIds',
            'Delete Collections',
            'Delete ALL Collections',
            'Exit'
        ]
    }
];

const questionsStage2 = [
    {
        type: 'rawlist',
        name: 'stage2',
        message: 'Would you like to:',
        choices: [
            'Go Back',
            'Exit'
        ]
    }
];

const inputQuestions = [
    {
        type: 'input',
        name: 'collectionNames',
        message: 'Enter collection names:',
        validate: function(value) {
            if (value.length === 0) {
                return 'No collection-id given';
            }
            return true;
        }
    }
];

const confirmQuestions = [
    {
        type: 'confirm',
        name: 'confirmation',
        message: 'Are you sure?'
    }
];

const secondConfirmQuestions = [
    {
        type: 'confirm',
        name: 'secondConfirmation',
        message: 'Are you DOUBLE sure?'
    }
]

function main() {
    inquirer.prompt(questionsStage1).then(async answers => {
        if (answers.introduction === 'Count the Collections') {
            const collections = await returnCollection();
            console.log(`There are ${collections.length} collections, including 'allFaces' and 'Biz2Click'`);
            inquirer.prompt(questionsStage2).then(answers => {
                if (answers.stage2 === 'Go Back') {
                    main();
                } else if (answers.stage2 === 'Exit') {
                    exit();
                }
            });

        } else if (answers.introduction === 'Extract Collections with ExternalImageIds') {
            inquirer.prompt(confirmQuestions).then(answers => {
                if (answers.confirmation) {
                    collections.getCollections();
                    inquirer.prompt(questionsStage2).then(answers => {
                        if (answers.stage2 === 'Go Back') {
                            main();
                        } else if (answers.stage2 === 'Exit') {
                            exit();
                        }
                    });
                } else {
                    inquirer.prompt(questionsStage2).then(answers => {
                        if (answers.stage2 === 'Go Back') {
                            main();
                        } else if (answers.stage2 === 'Exit') {
                            exit();
                        }
                    });
                }
            });

        } else if (answers.introduction === 'Delete Collections') {
            inquirer.prompt(confirmQuestions).then(answers => {
                if (answers.confirmation) {
                    inquirer.prompt(inputQuestions).then(answers => {
                        listCollection(answers);
                    });
                } else {
                    inquirer.prompt(questionsStage2).then(answers => {
                        if (answers.stage2 === 'Go Back') {
                            main();
                        } else if (answers.stage2 === 'Exit') {
                            exit();
                        }
                    });
                }
            });

        } else if (answers.introduction === 'Delete ALL Collections') {
            inquirer.prompt(confirmQuestions).then(answers => {
                if (answers.confirmation) {
                    inquirer.prompt(secondConfirmQuestions).then(answers => {
                        if (answers.secondConfirmation) {
                            listAllCollections();
                        } else {
                            inquirer.prompt(questionsStage2).then(answers => {
                                if (answers.stage2 === 'Go Back') {
                                    main();
                                } else if (answers.stage2 === 'Exit') {
                                    exit();
                                }
                            });
                        }
                    });
                } else {
                    inquirer.prompt(questionsStage2).then(answers => {
                        if (answers.stage2 === 'Go Back') {
                            main();
                        } else if (answers.stage2 === 'Exit') {
                            exit();
                        }
                    });
                }
            });

        } else if (answers.introduction === 'Exit') {
            exit();
        }
    });
}

//---------------------------------------------------------------------------------
// Default functions
function exit() {
    console.log("Goodbye, please come again...");
}

//---------------------------------------------------------------------------------
// Count the Collections
const returnCollection= async () => {
    const collectionData = await rekognition.listCollections().promise();
    const collections = collectionData.CollectionIds;
    return collections;
};

//---------------------------------------------------------------------------------
// Delete the Collections
const listCollection = async (answers) => {
    const allAnswers = answers.collectionNames.split(' ');
    allAnswers.forEach(collection => {
        deleteCollection(collection);
    });
}

// Delete ALL Collections
const listAllCollections = async () => {
    const collections = await returnCollection();

    collections.forEach((collection) => {
        if (collection !== 'allFaces' && collection !== 'biz2click') {
            deleteCollection(collection);
        }
    });
}

// Delete the collection
function deleteCollection(collection) {
    const deleteParams = {
        CollectionId: collection
    };

    console.log(`DELETING COLLECTION: ${collection}`);
    rekognition.deleteCollection(deleteParams, function(err, deleteData) {
        if (err) {
            console.log(err.message);
            console.log("RUN APP AGAIN...")
        } else {
            console.log(deleteData);
        }
    });
}
//---------------------------------------------------------------------------------

main();