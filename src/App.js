import React, { Component } from 'react';
import './App.css';
import { Dapparatus, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button, PrivateKeyCatcher } from "dapparatus"
import Web3 from 'web3';

const FALLBACK_WEB3_PROVIDER = "http://localhost:8545"
const METATX = false

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
    }
  }
  handleInput(e){
    let update = {}
    update[e.target.name] = e.target.value
    this.setState(update)
  }
  render() {
    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan,metaAccount} = this.state
    let connectedDisplay = []
    let contractsDisplay = []
    if(web3){
      connectedDisplay.push(
       <Gas
         key="Gas"
         onUpdate={(state)=>{
           console.log("Gas price update:",state)
           this.setState(state,()=>{
             console.log("GWEI set:",this.state)
           })
         }}
       />
      )

      connectedDisplay.push(
        <ContractLoader
         key="ContractLoader"
         config={{DEBUG:true}}
         web3={web3}
         require={path => {return require(`${__dirname}/${path}`)}}
         onReady={(contracts,customLoader)=>{
           console.log("contracts loaded",contracts)
           this.setState({contracts:contracts},async ()=>{
             console.log("Contracts Are Ready:",this.state.contracts)
             this.setState({
               purpose: await this.state.contracts["NiftyDao"].purpose().call()
             })
           })
         }}
        />
      )
      connectedDisplay.push(
        <Transactions
          key="Transactions"
          config={{DEBUG:false}}
          account={account}
          gwei={gwei}
          web3={web3}
          block={block}
          avgBlockTime={avgBlockTime}
          etherscan={etherscan}
          metaAccount={metaAccount}
          onReady={(state)=>{
            console.log("Transactions component is ready:",state)
            this.setState(state)
          }}
          onReceipt={(transaction,receipt)=>{
            // this is one way to get the deployed contract address, but instead I'll switch
            //  to a more straight forward callback system above
            console.log("Transaction Receipt",transaction,receipt)
          }}
        />
      )

      if(contracts){
        contractsDisplay.push(
          <div key="UI" style={{padding:30}}>
            <div>
              <h2>
                {this.state.purpose}
              </h2>
            </div>
            <div>
              <Address
                {...this.state}
                address={contracts["NiftyDao"]._address}
              />
            </div>

          </div>
        )
      }

    }
    return (
      <div className="App">
        <PrivateKeyCatcher newPrivateKey={(pk)=>{
          this.setState({newPrivateKey:pk})
        }}/>
        <Dapparatus
          config={{
            DEBUG:false,
            metatxAccountGenerator:false,
            requiredNetwork:['Unknown','Private','Rinkeby'],
            hide:false
          }}
          metatx={METATX}
          newPrivateKey={this.state.newPrivateKey}
          fallbackWeb3Provider={new Web3.providers.HttpProvider(FALLBACK_WEB3_PROVIDER)}
          onUpdate={(state)=>{
            console.log("metamask state update:",state)
            if(state.web3Provider) {
              state.web3 = new Web3(state.web3Provider)
              this.setState(state)
            }
          }}
        />
        {connectedDisplay}
        {contractsDisplay}
      </div>
    );
  }
}

export default App;