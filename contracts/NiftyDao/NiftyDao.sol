pragma solidity ^0.5.0;

import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721MetadataMintable.sol";
import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Burnable.sol";

contract NiftyDao is ERC721MetadataMintable, ERC721Burnable {

  string public purpose = "Rapid Dapp Prototyping - BTC2019!!!";

  constructor(string memory name, string memory symbol) ERC721Metadata(name, symbol) public {
      memberCount = members.push(msg.sender);
  }


  

  uint256 public totalTokenCount = 0;

  mapping (string => uint256) public tokenCount;

  function buyToken(string memory _tokenURI) public payable {
    require(votedInToken[_tokenURI],"NiftyDao::buyToken illegal token uri");
    require(msg.value==tokenPrice[_tokenURI],"NiftyDao::buyToken wrong value");
    _mint(msg.sender, totalTokenCount);
    _setTokenURI(totalTokenCount, _tokenURI);
    totalTokenCount = totalTokenCount+1;
    tokenCount[_tokenURI] = tokenCount[_tokenURI]+1;
    tokenPrice[_tokenURI] = tokenPrice[_tokenURI]+tokenCurve[_tokenURI];
  }

  function sellToken(uint256 tokenId) public {
    string memory uri = tokenURI(tokenId);
    tokenCount[uri] = tokenCount[uri]-1;
    tokenPrice[uri] = tokenPrice[uri]-tokenCurve[uri];
    burn(tokenId);
    msg.sender.transfer(tokenPrice[uri]);
  }




  address[] public members;
  uint256 public memberCount;
  mapping (address => uint256) public votes;
  mapping (address => mapping (address => bool)) public voted;

  function isMember(address _address) public view returns (bool){
    for(uint m=0;m<memberCount;m++){
      if(members[m]==_address){
        return true;
      }
    }
    return false;
  }

  function addMember(address _address) public {
    require(isMember(msg.sender),"NiftyDao::addMember must be a member");
    require(!isMember(_address),"NiftyDao::addMember new address cant be a member already");
    require(!voted[msg.sender][_address],"NiftyDao::addMember cant vote twice");
    voted[msg.sender][_address] = true;
    votes[_address] = votes[_address]+1;
    if(votes[_address]>=memberCount){
      memberCount = members.push(_address);
    }

  }






  mapping (string => uint256) public tokenPrice;
  mapping (string => uint256) public tokenCurve;

  mapping (string => bool) public votedInToken;
  mapping (string => uint256) public tokenVotes;
  mapping (address => mapping (string => bool)) public votedOnToken;

  function addToken(string memory _uri, uint256 _price, uint256 _curve) public {
    require(isMember(msg.sender),"NiftyDao::addToken must be a member");
    require(!votedOnToken[msg.sender][_uri],"NiftyDao::addMember cant vote twice");
    votedOnToken[msg.sender][_uri] = true;
    if(tokenPrice[_uri]>0){
      require(tokenPrice[_uri]==_price,"NiftyDao::addToken votes must have the same price");
      require(tokenCurve[_uri]==_curve,"NiftyDao::addToken votes must have the same curve");
    }else{
      tokenPrice[_uri]=_price;
      tokenCurve[_uri]=_curve;
    }
    tokenVotes[_uri] = tokenVotes[_uri]+1;
    if(tokenVotes[_uri]>=memberCount){
      votedInToken[_uri] = true;
      emit NewToken(_uri);
    }
  }
  event NewToken(string uri);


}
