const ReImprove = require('reimprovejs/dist/reimprove');

/**
 * @param {int} inputSize
 * @param {int} numActions
 * @return {Academy}
 */
function getAcademy(inputSize, numActions) {
    const modelFitConfig = {
        epochs: 1,
        stepsPerEpoch: 16,
    };
    const temporalWindow = 1;
    const totalInputSize = inputSize * temporalWindow + numActions * temporalWindow + inputSize;

    const network = new ReImprove.NeuralNetwork();
    network.InputShape = [totalInputSize];
    network.addNeuralNetworkLayers(
        [
            {type: 'dense', units: 32, activation: 'relu'},
            {type: 'dense', units: 32, activation: 'relu'},
            {type: 'dense', units: numActions, activation: 'softmax'},
        ]
    );
    const model = new ReImprove.Model.FromNetwork(network, modelFitConfig);


    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
    const teacherConfig = {
        lessonsQuantity: 1000,
        lessonLength: 100,
        lessonsWithRandom: 0,
        epsilon: 1,
        epsilonDecay: 0.99,
        epsilonMin: 0.05,
        gamma: 1,
    };

    const agentConfig = {
        model: model,
        agentConfig: {
            memorySize: 5000,
            batchSize: 128,
            temporalWindow: temporalWindow,
        },
    };

    const academy = new ReImprove.Academy();
    const teacher = academy.addTeacher(teacherConfig);
    const agent = academy.addAgent(agentConfig);

    academy.assignTeacherToAgent(agent, teacher);
    return academy;
}

module.exports = {
    getAcademy,
};
