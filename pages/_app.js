import "../styles/globals.css";
import Link from "next/link";
import Web3 from "web3";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";

function MyApp({ Component, pageProps }) {
    const [balance, setBalance] = useState("...");
    const [networkId, setNetworkId] = useState(null);
    const [networkName, setNetworkName] = useState("loading");
    useEffect(() => {
        loadNFTs();
    }, []);
    async function loadNFTs() {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);

        const signer = await provider.eth.getAccounts();
        const signerBalance = await provider.eth.getBalance(signer[0]);
        const signerBalanceEth = provider.utils.fromWei(signerBalance);
        const signerBalanceEthFloor =
            Math.floor(signerBalanceEth * 10000) / 10000;

        const networkId = await provider.eth.net.getId();
        const networkName = await provider.eth.net.getNetworkType();
        setNetworkId(networkId);
        setNetworkName(networkName);
        setBalance(signerBalanceEthFloor);
    }
    return (
        <div>
            <nav className="border-b p-6">
                <p className="text-4xl font-bold text-center">
                    Artem NFT Marketplace
                </p>
                <p className="text-4xl font-bold text-center">
                    {balance} ETH - {networkName}
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
            {networkId === 4 ? (
                <Component {...pageProps} />
            ) : (
                `Your wallet is connected to the ${networkName} network. Please switch to Rinkeby`
            )}

            <p className="bg-blue-600 p-6 font-bold text-center text-white">
                v1.1.0
            </p>
        </div>
    );
}

export default MyApp;
