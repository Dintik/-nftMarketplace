/* pages/my-assets.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAdress, nfMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function MyAssets() {
    const [nfts, setNfts] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");
    useEffect(() => {
        loadNFTs();
    }, []);
    async function loadNFTs() {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();

        const marketContract = new provider.eth.Contract(
            Market.abi,
            nfMarketAddress,
            {
                from: signer[0],
            }
        );
        const tokenContract = new provider.eth.Contract(NFT.abi, nftAdress);
        const data = await marketContract.methods.fetchMyNFTs().call();

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
                };
                return item;
            })
        );
        setNfts(items);
        setLoadingState("loaded");
    }
    if (loadingState === "loaded" && !nfts.length)
        return <h1 className="py-10 px-20 text-3xl">No assets owned</h1>;
    return (
        <div className="flex justify-center">
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {nfts.map((nft, i) => (
                        <div
                            key={i}
                            className="border shadow rounded-xl overflow-hidden"
                        >
                            <img src={nft.image} className="rounded" />
                            <div className="p-4 bg-black">
                                <p className="text-2xl font-bold text-white">
                                    Price - {nft.price} Eth
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
