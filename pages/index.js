/* pages/index.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAdress, nfMarketAddress, projectId } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
    const [nfts, setNfts] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");
    useEffect(() => {
        loadNFTs();
    }, []);
    async function loadNFTs() {
        /* create a generic provider and query for unsold market items */
        const provider = new Web3(
            `https://rinkeby.infura.io/v3/a796c259d5ab450a9f68a197083dbc3e`
        );
        const tokenContract = new provider.eth.Contract(NFT.abi, nftAdress);
        const marketContract = new provider.eth.Contract(
            Market.abi,
            nfMarketAddress
        );
        const data = await marketContract.methods.fetchMarketItems().call();

        /*
         *  map over items returned from smart contract and format
         *  them as well as fetch their token metadata
         */
        const items = await Promise.all(
            data.map(async (i) => {
                const tokenUri = await tokenContract.methods
                    .tokenURI(i.tokenId)
                    .call();
                const meta = await axios.get(tokenUri);
                let price = provider.utils.fromWei(i.price.toString(), "ether");
                let item = {
                    price,
                    tokenId: i.tokenId,
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                };
                return item;
            })
        );
        setNfts(items);
        setLoadingState("loaded");
    }
    async function buyNft(nft) {
        /* needs the user to sign the transaction, so will use Web3Provider and sign it */
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();
        const contract = new provider.eth.Contract(Market.abi, nfMarketAddress);

        /* user will be prompted to pay the asking proces to complete the transaction */
        const price = provider.utils.toWei(nft.price.toString(), "ether");
        const transaction = await contract.methods
            .createMarketSale(nftAdress, nft.tokenId)
            .send({
                from: signer[0],
                value: price,
            });
        await transaction;
        loadNFTs();
    }
    if (loadingState === "loaded" && !nfts.length)
        return (
            <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
        );
    return (
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: "1600px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {nfts.map((nft, i) => (
                        <div
                            key={i}
                            className="border shadow rounded-xl overflow-hidden"
                        >
                            <img src={nft.image} alt={""} />
                            <div className="p-4">
                                <p
                                    style={{ height: "64px" }}
                                    className="text-2xl font-semibold"
                                >
                                    {nft.name}
                                </p>
                                <div
                                    style={{
                                        height: "70px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <p className="text-gray-400">
                                        {nft.description}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-black">
                                <p className="text-2xl mb-4 font-bold text-white">
                                    {nft.price} ETH
                                </p>
                                <button
                                    className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                                    onClick={() => buyNft(nft)}
                                >
                                    Buy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
