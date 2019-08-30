pragma solidity ^0.5.0;

import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721MetadataMintable.sol";
import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Burnable.sol";

contract NiftyDao is ERC721MetadataMintable, ERC721Burnable {

  string public purpose = "Rapid Dapp Prototyping - BTC2019!!!";

  constructor(string memory name, string memory symbol) ERC721Metadata(name, symbol) public {
      memberCount = members.push(msg.sender);
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

}
