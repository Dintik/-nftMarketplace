/* pages/creator-dashboard.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAdress, nfMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreatorDashboard() {
    const [nfts, setNfts] = useState([]);
    const [sold, setSold] = useState([]);
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
        const data = await marketContract.methods.fetchItemsCreated().call();

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
                    sold: i.sold,
                    image: meta.data.image,
                };
                return item;
            })
        );
        /* create a filtered array of items that have been sold */
        const soldItems = items.filter((i) => i.sold);
        setSold(soldItems);
        setNfts(items);
        setLoadingState("loaded");
    }
    if (loadingState === "loaded" && !nfts.length)
        return <h1 className="py-10 px-20 text-3xl">No assets created</h1>;
    return (
        <div>
            <div className="p-4">
                <h2 className="text-2xl py-2">Items Created</h2>
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
            <div className="px-4">
                {Boolean(sold.length) && (
                    <div>
                        <h2 className="text-2xl py-2">Items sold</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            {sold.map((nft, i) => (
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
                )}
            </div>
        </div>
    );
}
