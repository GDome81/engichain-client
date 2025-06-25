// Environment configuration
const environment = {
  development: {
    BASE_URL: 'http://ec2-34-243-60-165.eu-west-1.compute.amazonaws.com:8080',
    AWS_CONFIG: {
      region: 'eu-west-1',
      userPoolId: 'eu-west-1_w8iQSfeFP',
      userPoolWebClientId: '38tq9prcdc8rafa672kih1hmos'
    },
    BLOCKCHAIN_TYPES: ['ETHEREUM', 'POLYGON']
  },
  production: {
    BASE_URL: 'https://your-production-api.com/api',
    AWS_CONFIG: {
      region: 'eu-west-1',
      userPoolId: 'eu-west-1_w8iQSfeFP',
      userPoolWebClientId: '38tq9prcdc8rafa672kih1hmos'
    },
    BLOCKCHAIN_TYPES: ['ETHEREUM', 'POLYGON']
  }
};

const currentEnvironment = process.env.NODE_ENV || 'development';

export default environment[currentEnvironment];