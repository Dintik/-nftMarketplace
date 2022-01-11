import "../styles/globals.css";
import Link from "next/link";
import Web3 from "web3";
import { useCallback, useEffect, useReducer } from "react";
import Web3Modal from "web3modal";

let web3Modal;
if (typeof window !== "undefined") {
    web3Modal = new Web3Modal();
}

const initialState = {
    connection: null,
    provider: null,
    addressSigner: null,
    chainId: null,
    networkName: null,
    balanceEthFloor: null,
};

function reducer(state, action) {
    switch (action.type) {
        case "SET_WEB3_PROVIDER":
            return {
                ...state,
                connection: action.connection,
                provider: action.provider,
                addressSigner: action.addressSigner,
                chainId: action.chainId,
                networkName: action.networkName,
                balanceEthFloor: action.balanceEthFloor,
            };
        case "SET_ADDRESS":
            return {
                ...state,
                addressSigner: action.addressSigner,
                balanceEthFloor: action.balanceEthFloor,
            };
        case "SET_CHAIN_ID":
            return {
                ...state,
                chainId: action.chainId,
                networkName: action.networkName,
                balanceEthFloor: action.balanceEthFloor,
            };
        case "RESET_WEB3_PROVIDER":
            return initialState;
        default:
            throw new Error();
    }
}

function MyApp({ Component, pageProps }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        connection,
        provider,
        addressSigner,
        chainId,
        networkName,
        balanceEthFloor,
    } = state;

    const connect = useCallback(async function () {
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();
        const addressSigner = signer[0];
        const networkId = await provider.eth.net.getId();
        const networkName = await provider.eth.net.getNetworkType();

        const balance = await provider.eth.getBalance(addressSigner);
        const balanceEth = provider.utils.fromWei(balance);
        const balanceEthFloor = Math.floor(balanceEth * 10000) / 10000;

        dispatch({
            type: "SET_WEB3_PROVIDER",
            connection,
            provider,
            addressSigner,
            chainId: networkId,
            networkName,
            balanceEthFloor,
        });
    }, []);

    const disconnect = useCallback(
        async function () {
            await web3Modal.clearCachedProvider();
            if (
                connection?.disconnect &&
                typeof connection.disconnect === "function"
            ) {
                await connection.disconnect();
            }
            dispatch({
                type: "RESET_WEB3_PROVIDER",
            });
        },
        [connection]
    );

    useEffect(() => {
        // if (web3Modal.cachedProvider) {
        connect();
        // }
    }, [connect]);

    useEffect(() => {
        if (connection?.on) {
            async function handleAccountsChanged(accounts) {
                const balance = await provider.eth.getBalance(accounts[0]);
                const balanceEth = provider.utils.fromWei(balance);
                const balanceEthFloor = Math.floor(balanceEth * 10000) / 10000;
                dispatch({
                    type: "SET_ADDRESS",
                    addressSigner: accounts[0],
                    balanceEthFloor: balanceEthFloor,
                });
            }

            const handleChainChanged = (_hexChainId) => {
                window.location.reload();
            };

            const handleDisconnect = (error) => {
                console.log("disconnect", error);
                disconnect();
            };

            connection.on("accountsChanged", handleAccountsChanged);
            connection.on("chainChanged", handleChainChanged);
            connection.on("disconnect", handleDisconnect);

            return () => {
                if (connection.removeListener) {
                    connection.removeListener(
                        "accountsChanged",
                        handleAccountsChanged
                    );
                    connection.removeListener(
                        "chainChanged",
                        handleChainChanged
                    );
                    connection.removeListener("disconnect", handleDisconnect);
                }
            };
        }
    }, [connection, disconnect]);

    function ucFirst(str) {
        if (!str) return str;
        return str[0].toUpperCase() + str.slice(1);
    }

    return (
        <div>
            <header className="flex justify-around px-6 py-12">
                {addressSigner && (
                    <div className="grid">
                        <div>
                            <p className="mb-1">
                                Network: {ucFirst(networkName)}
                            </p>
                        </div>
                        <div>
                            <p className="mb-1">Address: {addressSigner}</p>
                        </div>
                    </div>
                )}
                <div>
                    {provider ? (
                        <button
                            className="bg-blue-600 text-white font-bold py-2 px-12 rounded false"
                            type="button"
                            onClick={disconnect}
                        >
                            Disconnect
                        </button>
                    ) : (
                        <button
                            className="bg-blue-600 text-white font-bold py-2 px-12 rounded false"
                            type="button"
                            onClick={connect}
                        >
                            Connect
                        </button>
                    )}
                </div>
            </header>
            <nav className="border-b p-8">
                <p className="text-4xl font-bold text-center">
                    Artem NFT Marketplace
                </p>
                <p className="text-4xl font-bold text-center">
                    {balanceEthFloor} ETH - {ucFirst(networkName)}
                </p>
                <div className="flex justify-center mt-4">
                    <Link href="/">
                        <a className="mr-4 text-pink-600">Home</a>
                    </Link>
                    <Link href="/create-item">
                        <a className="mr-6 text-pink-600">Sell Digital Asset</a>
                    </Link>
                    <Link href="/my-assets">
                        <a className="mr-6 text-pink-600">My Digital Assets</a>
                    </Link>
                    <Link href="/creator-dashboard">
                        <a className="mr-6 text-pink-600">Creator Dashboard</a>
                    </Link>
                    <Link href="/tokenPage">
                        <a className="mr-6 text-pink-600">Token Page</a>
                    </Link>
                </div>
            </nav>
            {chainId === 4 ? (
                <Component {...state} />
            ) : (
                `Your wallet is connected to the ${ucFirst(
                    networkName
                )} network. Please switch to Rinkeby`
            )}
            <p className="bg-blue-600 p-6 font-bold text-center text-white">
                v1.0.0
            </p>
        </div>
    );
}

export default MyApp;
