/* pages/index.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

import { nftAdress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";

export default function Home() {
    const [nftsAll, setNftsAll] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");
    useEffect(() => {
        loadNFTs();
    }, []);
    async function loadNFTs() {
        const provider = new Web3(
            `https://rinkeby.infura.io/v3/a796c259d5ab450a9f68a197083dbc3e`
        );
        const tokenContract = new provider.eth.Contract(NFT.abi, nftAdress);
        const NftsLengt = await tokenContract.methods.totalSupply().call();

        const allItems = [];

        for (let i = 0; i < NftsLengt; i++) {
            const tokenUri = await tokenContract.methods.tokenURI(i + 1).call();
            const meta = await axios.get(tokenUri);
            let item = {
                tokenId: i + 1,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description,
            };
            allItems.push(item);
        }

        setNftsAll(allItems);
        setLoadingState("loaded");
    }
    if (loadingState === "loaded" && !nftsAll.length)
        return (
            <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
        );
    return (
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: "1600px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {nftsAll.map((nft, i) => (
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
                                <Link
                                    href={{
                                        pathname: "/token/[id]",
                                    }}
                                    as={`/token/${nft.tokenId}`}
                                    tokenId={nft.tokenId}
                                >
                                    <a className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded">
                                        Open
                                    </a>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
