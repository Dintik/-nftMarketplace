/* pages/my-assets.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { useRouter } from "next/router";

import { nftAdress, nfMarketAddress } from "../../config";

import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Token() {
    const router = useRouter();
    const tokenId = router?.query?.id;
    const [nft, setNft] = useState({});
    const [loadingState, setLoadingState] = useState("not-loaded");
    useEffect(() => {
        loadNFT();
    }, []);
    async function loadNFT() {
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

        const networkName = await provider.eth.net.getNetworkType();
        const data = await marketContract.methods
            .fetchMarketItem(tokenId)
            .call();

        const itemArr = await Promise.all(
            data.map(async (i) => {
                const tokenUri = await tokenContract.methods
                    .tokenURI(tokenId)
                    .call();
                const owner = await tokenContract.methods
                    .ownerOf(tokenId)
                    .call();
                const collectionName = await tokenContract.methods
                    .name()
                    .call();
                const tokenCreatedArr = await tokenContract.getPastEvents(
                    "Transfer",
                    {
                        filter: {
                            tokenId: tokenId,
                            from: "0x0000000000000000000000000000000000000000",
                        },
                        fromBlock: 0,
                        toBlock: "latest",
                    }
                );
                const itemActivity = await tokenContract.getPastEvents(
                    "Transfer",
                    {
                        filter: {
                            tokenId: tokenId,
                        },
                        fromBlock: 0,
                        toBlock: "latest",
                    }
                );
                const tokenCreated = tokenCreatedArr[0];

                const meta = await axios.get(tokenUri);
                let price = provider.utils.fromWei(i.price.toString(), "ether");
                let item = {
                    price,
                    tokenId,
                    owner,
                    networkName,
                    collectionName,
                    itemActivity,
                    seller: i.seller,
                    name: meta.data.name,
                    image: meta.data.image,
                    description: meta.data.description,
                    creator: tokenCreated.returnValues.to,
                    contractAddress: tokenCreated.address,
                };

                return item;
            })
        );

        const item = await itemArr[0];
        setNft(item);
        setLoadingState("loaded");
    }

    async function buyNft(nft) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();
        const contract = new provider.eth.Contract(Market.abi, nfMarketAddress);

        const price = provider.utils.toWei(nft.price.toString(), "ether");
        const transaction = await contract.methods
            .createMarketSale(nftAdress, nft.tokenId)
            .send({
                from: signer[0],
                value: price,
            });
        await transaction;
        loadNFT();
    }

    function ucFirst(str) {
        if (!str) return str;
        return str[0].toUpperCase() + str.slice(1);
    }

    if (loadingState === "not-loaded")
        return (
            <h1 className="py-10 px-20 text-3xl">
                Loading in progress, please wait
            </h1>
        );
    if (loadingState === "loaded" && !nft)
        return <h1 className="py-10 px-20 text-3xl">No assets</h1>;
    return (
        <div className="flex justify-center">
            <div className="px-40 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 pt-2">
                    <div className="p-4">
                        <div className="border shadow rounded-xl overflow-hidden">
                            <img src={nft?.image} className="rounded" />
                        </div>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="font-bold">Description</p>
                            <br />
                            {nft?.creator ? (
                                <p className="opacity-60">
                                    Created by{" "}
                                    <a
                                        href={`/${nft.creator}`}
                                        className="text-blue-800"
                                    >
                                        {nft.creator.slice(2, 8)}
                                    </a>
                                </p>
                            ) : (
                                ""
                            )}
                            <p className="">{nft?.description}</p>
                        </div>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="font-bold">
                                About {nft?.collectionName} - !!!TODO!!!
                            </p>
                            <br />
                            <p className="">!!!TODO!!!</p>
                        </div>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="font-bold">Details</p>
                            <br />

                            {nft?.contractAddress ? (
                                <p className="flex justify-between">
                                    Contract Address
                                    <span>
                                        <a
                                            href={`https://rinkeby.etherscan.io/address/${nft.contractAddress}`}
                                            target="_blank"
                                            className="text-blue-600"
                                        >
                                            {nft.contractAddress.slice(0, 6)}...
                                            {nft.contractAddress.slice(38)}
                                        </a>
                                    </span>
                                </p>
                            ) : (
                                ""
                            )}

                            <p className="flex justify-between">
                                Token ID
                                <span>{nft?.tokenId}</span>
                            </p>
                            <p className="flex justify-between">
                                Token Standard <span>ERC-721</span>
                            </p>
                            <p className="flex justify-between">
                                Blockchain{" "}
                                <span>{ucFirst(nft?.networkName)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="py-6">
                        <p className="">Metaverse Tokens - !!!TODO!!!</p>
                        <br />
                        <p className="text-2xl font-bold">{nft?.name}</p>
                        <br />
                        <p className="">
                            {nft?.owner ? (
                                <span>
                                    Owned by{" "}
                                    <a
                                        href={`/${nft.owner}`}
                                        className="text-blue-600"
                                    >
                                        {nft.owner.slice(2, 8)}
                                    </a>
                                </span>
                            ) : (
                                ""
                            )}
                        </p>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="">Sale ends !!!TODO!!!</p>
                            <br />
                            <p className="">Current price</p>
                            <p className="font-bold">{nft?.price} ETH</p>
                            <button
                                disabled={nft?.price == 0}
                                className={`bg-blue-600 text-white font-bold py-2 px-12 rounded ${
                                    nft?.price == 0 && "opacity-50"
                                }`}
                                onClick={() => buyNft(nft)}
                            >
                                Buy now
                            </button>
                        </div>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="font-bold">Price History</p>
                            <br />
                            <p className="font-bold">!!!TODO!!!</p>
                        </div>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="font-bold">Lisings</p>
                            <br />
                            <div className="grid grid-cols-4 gap-4">
                                <div>Price</div>
                                <div>USD Price</div>
                                <div>Expiration</div>
                                <div>From</div>
                                <div>{nft?.price} ETH</div>
                                <div>!!!TODO!!!</div>
                                <div>!!!TODO!!!</div>
                                <div>
                                    {nft?.seller ? (
                                        <a
                                            href={`/${nft.seller}`}
                                            className="text-blue-600"
                                        >
                                            {nft.seller.slice(2, 8)}
                                        </a>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>
                        </div>
                        <br />
                        <div className="p-4 border shadow rounded-xl overflow-hidden">
                            <p className="font-bold">Offers</p>
                            <br />
                            <p className="font-bold">!!!TODO!!!</p>
                        </div>
                    </div>
                </div>
                <br />
                <div className="pl-4 ">
                    <div className="p-4 border shadow rounded-xl overflow-hidden">
                        <p className="font-bold">Item Activity</p>
                        <br />

                        <div className="grid grid-cols-5 gap-4 px-4 border py-2">
                            <div>Event</div>
                            <div>Price</div>
                            <div>From</div>
                            <div>To</div>
                            <div>Date</div>
                        </div>

                        {nft?.itemActivity.map((event, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-5 gap-4 border  p-4"
                            >
                                {console.log(event)}
                                <div>{event?.event}</div>
                                <div>!!!TODO!!!</div>
                                <div>
                                    {event?.returnValues?.from ? (
                                        <a
                                            href={`/${event.returnValues.from}`}
                                            className="text-blue-600"
                                        >
                                            {event.returnValues.from.slice(
                                                2,
                                                8
                                            )}
                                        </a>
                                    ) : (
                                        ""
                                    )}
                                </div>
                                <div>
                                    {event?.returnValues?.to ? (
                                        <a
                                            href={`/${event.returnValues.to}`}
                                            className="text-blue-600"
                                        >
                                            {event.returnValues.to.slice(2, 8)}
                                        </a>
                                    ) : (
                                        ""
                                    )}
                                </div>
                                <div>!!!TODO!!!</div>
                            </div>
                        ))}
                    </div>
                </div>
                <br />
                <div className="pl-4 pb-10">
                    <div className="p-4 border shadow rounded-xl overflow-hidden">
                        <p className="font-bold">More From This Collection</p>
                        <br />
                        <p className="font-bold">!!!TODO!!!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
