require("@nomiclabs/hardhat-waffle");

const fs = require("fs");
const privateKey = fs.readFileSync(".secret").toString();
const projectId = "a796c259d5ab450a9f68a197083dbc3e";

module.exports = {
    networks: {
        hardhat: {
            chainId: 1337,
        },
        mumbai: {
            url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
            accounts: [privateKey],
        },
        mainnet: {
            url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
            accounts: [privateKey],
        },

        rinkeby: {
            provider: () =>
                new HDWalletProvider(
                    mnemonic,
                    `https://rinkeby.infura.io/v3/a058544a12d143f999b95a81a50b6ab9`
                ),
            network_id: `4`,
            url: `https://rinkeby.infura.io/v3/a796c259d5ab450a9f68a197083dbc3e`,
            // network_id: `22`,
            // gas: 5500000, // Ropsten has a lower block limit than mainnet
            // gasPrice: 20000000000
            networkCheckTimeout: 1_000_000,
            accounts: [privateKey],
        },
    },
    solidity: {
        version: "0.8.4",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};
