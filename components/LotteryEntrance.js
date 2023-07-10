import { abi, contractAddresses } from "../constants"
import { useMoralis, useWeb3Contract, useMoralisQuery } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { FaBell } from "react-icons/fa"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setNrecentWinner] = useState("0")

    const dispatch = useNotification()

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numPlayersFromCall = (await getNumberOfPlayers()).toString()
        const recentWinnerFromCall = await getRecentWinner()
        setEntranceFee(entranceFeeFromCall)
        setNumPlayers(numPlayersFromCall)
        setNrecentWinner(recentWinnerFromCall)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        /*wait for 1 block confirmation*/
        console.log(tx)
        handleNewNotification()
        updateUI()
        listenForWinnerToBePicked()
    }

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Transaction Notification",
            position: "topR",
            icon: <FaBell />,
        })
    }

    async function listenForWinnerToBePicked() {
        const raffle = new ethers.Contract(raffleAddress, abi, web3)
        console.log("Listener fired!")
        await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
                console.log("WinnerPicked event fired!")
                try {
                    updateUI()
                    resolve()
                } catch (error) {
                    console.log(error)
                    reject(error)
                }
            })
        })
    }

    return (
        <div className="p-5">
            Hi from lottery entrance!
            {raffleAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterRaffle({
                                // onComplete:
                                // onError:
                                onSuccess:
                                    handleSuccess /*Check if the tx has been sent to metamask*/,
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <div> Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH </div>
                    <div>Number of Players: {numPlayers}</div>
                    <div>Recent Winner : {recentWinner}</div>
                </div>
            ) : (
                <div>No Raffle Address Detected</div>
            )}
        </div>
    )
}
