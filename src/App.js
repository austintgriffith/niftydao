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
  async poll(){

    let totalTokenCount = await this.state.contracts["NiftyDao"].totalTokenCount().call()
    let allTokens = []
    let myTokens = []
    for(let t=0;t < totalTokenCount;t++)
    {
      try{
        allTokens[t] = {
          id: t,
          uri: await this.state.contracts["NiftyDao"].tokenURI(t).call(),
          owner: await this.state.contracts["NiftyDao"].ownerOf(t).call()
        }
        if(allTokens[t].owner.toLowerCase() == this.state.account.toLowerCase()){
          myTokens.push(allTokens[t])
        }
      }catch(e){console.log(e)}
    }

    let memberCount = await this.state.contracts["NiftyDao"].memberCount().call()
    let members = []
    let quorum = await this.state.contracts["NiftyDao"].quorum().call()
    let exits = []
    for(let m=0;m < memberCount;m++)
    {
      let thisMember = await this.state.contracts["NiftyDao"].members(m).call()
      if(members.indexOf(thisMember) < 0){
        members.push(thisMember)
      }
      exits[members[m]] = await this.state.contracts["NiftyDao"].exited(members[m]).call()
    }

    let tokens = []
    for(let e in this.state.tokenEvents){
      let uri = this.state.tokenEvents[e].uri
      tokens.push({
        uri: uri,
        count: await this.state.contracts["NiftyDao"].tokenCount(uri).call(),
        price: await this.state.contracts["NiftyDao"].tokenPrice(uri).call(),
        curve: await this.state.contracts["NiftyDao"].tokenCurve(uri).call(),
      })
    }

    this.setState({
      totalTokenCount: totalTokenCount,
      allTokens: allTokens,
      myTokens: myTokens,
      tokens: tokens,
      memberCount: memberCount,
      members: members,
      quorum: quorum,
      exits: exits,
    })
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
             setInterval(this.poll.bind(this),1777)
             setTimeout(this.poll.bind(this),7)
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

      let members = []
      if(this.state.members){
        members = this.state.members.map((address)=>{
          return (
            <div key={address+"_member"} style={{opacity:this.state.exits[address]?0.25:1}}>
              <Address
                {...this.state}
                address={address}
              />
            </div>
          )
        })
      }

      let tokens = []
      if(this.state.tokens){
        tokens = this.state.tokens.map((token)=>{
          let foundToken
          for(let t in this.state.myTokens){
            if(token.uri==this.state.myTokens[t].uri){
              foundToken = this.state.myTokens[t]
              break
            }
          }
          return (
            <div style={{paddingTop:40}}>
              <div>
                <img style={{maxWidth:50,maxHeight:50}} src={token.uri}></img>
              </div>
              <div style={{fontSize:14}}>
                <div>
                  Count: {token.count}
                </div>
              </div>
              <Button color={"blue"} size="2" onClick={()=>{
                  tx(contracts.NiftyDao.buyToken(token.uri),240000,"0x",token.price,(receipt)=>{
                      console.log(receipt)
                    //  this.setState({addToken:"",addTokenPrice:"",addTokenCurve:"",})
                  })
                }}>
                Buy ${(token.price/10**18).toFixed(2)}
              </Button>
              <Button color={foundToken?"blue":"gray"} size="2" onClick={()=>{
                  console.log("attempting to sell token",foundToken.id)
                  tx(contracts.NiftyDao.sellToken(foundToken.id),240000,(receipt)=>{
                      console.log(receipt)
                    //  this.setState({addToken:"",addTokenPrice:"",addTokenCurve:"",})
                  })
                }}>
                Sell ${((token.price-token.curve)/10**18).toFixed(2)}
              </Button>
            </div>
          )
        })
      }

      console.log(this.state.myTokens)
      let myTokens = []
      if(this.state.myTokens){
        for(let t in this.state.myTokens){
          let token = this.state.myTokens[t]
          myTokens.push(
            <div>
              #{token.id} <img style={{maxWidth:50,maxHeight:50}} src={token.uri}></img>
            </div>
          )
        }
      }

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

            <Events
              config={{hide:true}}
              contract={contracts.NiftyDao}
              eventName={"NewToken"}
              block={block}
              onUpdate={(eventData,allEvents)=>{
                this.setState({tokenEvents:allEvents})
              }}
            />

            <div style={{padding:"10%"}}>
              {tokens}
            </div>

            <div style={{padding:"10%"}}>
              {myTokens}
            </div>

            <div style={{padding:"10%"}}>
              <div>
                URI<input
                      style={{verticalAlign:"middle",width:400,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
                      type="text" name="addToken" value={this.state.addToken} onChange={this.handleInput.bind(this)}
                  />
              </div>
              <div>
                Price $<input
                      style={{verticalAlign:"middle",width:100,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
                      type="text" name="addTokenPrice" value={this.state.addTokenPrice} onChange={this.handleInput.bind(this)}
                  />
                Curve $<input
                      style={{verticalAlign:"middle",width:100,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
                      type="text" name="addTokenCurve" value={this.state.addTokenCurve} onChange={this.handleInput.bind(this)}
                  />
              </div>
              <Button color={"blue"} size="2" onClick={()=>{
                  tx(contracts.NiftyDao.addToken(this.state.addToken,this.state.addTokenPrice*10**18,this.state.addTokenCurve*10**18),240000,(receipt)=>{
                      console.log(receipt)
                    //  this.setState({addToken:"",addTokenPrice:"",addTokenCurve:"",})
                  })
                }}>
                Add Token
              </Button>
            </div>



            <div style={{padding:"10%"}}>
              NiftyDao has {this.state.quorum} active member(s)
              {members}
            </div>

            <div style={{padding:"10%"}}>
              <input
                  style={{verticalAlign:"middle",width:400,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
                  type="text" name="addMember" value={this.state.addMember} onChange={this.handleInput.bind(this)}
              />
              <Button color={"blue"} size="2" onClick={()=>{
                  tx(contracts.NiftyDao.addMember(this.state.addMember),120000,(receipt)=>{
                      console.log(receipt)
                      this.setState({addMember:""})
                  })
                }}>
                Add Member
              </Button>
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
