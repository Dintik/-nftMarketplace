/* pages/index.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import { getSortedTokensData } from "../lib/tokens";
import Link from "next/link";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAdress, nfMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home({ allTokenData }) {
    const [nfts, setNfts] = useState([]);
    const [NftsAll, setNftsAll] = useState([]);
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
        const NftsLengt = await tokenContract.methods.totalSupply().call();

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

        const allItems = [];

        for (let i = 0; i < NftsLengt; i++) {
            const tokenUri = await tokenContract.methods.tokenURI(i + 1).call();
            const meta = await axios.get(tokenUri);
            // let price = provider.utils.fromWei(i.price.toString(), "ether");
            let item = {
                // price,
                tokenId: i + 1,
                // seller: i.seller,
                // owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description,
            };
            allItems.push(item);
        }

        // console.log(await tokenContract.methods.tokenURI(1).call());
        // console.log(
        //     await tokenContract.getPastEvents("Transfer", {
        //         filter: {
        //             _from: "0x0000000000000000000000000000000000000000",
        //         },
        //         fromBlock: 0,
        //     })
        // );
        setNftsAll(allItems);
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
            <section>
                <h2>Blog</h2>
                <ul>
                    {allTokenData.map(({ id, date, title }) => (
                        <li key={id}>
                            <Link href="/token/[id]" as={`/token/${id}`}>
                                <a>{title}</a>
                            </Link>
                            <br />
                            <small>
                                <Date dateString={date} />
                            </small>
                        </li>
                    ))}
                </ul>
            </section>
            <div className="px-4" style={{ maxWidth: "1600px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {NftsAll.map((nft, i) => (
                        <div
                            key={i}
                            className="border shadow rounded-xl overflow-hidden"
                        >
                            <img src={nft.image} />
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
                                {/* <button
                                    className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                                    onClick={() => buyNft(nft)}
                                >
                                    Buy
                                </button> */}
                                <Link
                                    href="/token/[id]"
                                    as={`/token/${nft.tokenId}`}
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

export async function getStaticProps() {
    const allTokenData = getSortedTokensData();
    return {
        props: {
            allTokenData,
        },
    };
}
