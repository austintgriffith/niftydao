pragma solidity ^0.5.0;

import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721MetadataMintable.sol";
import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Burnable.sol";

contract NiftyDao is ERC721MetadataMintable, ERC721Burnable {

  string public purpose = "Rapid Dapp Prototyping - BTC2019!!!";

  constructor(string memory name, string memory symbol) ERC721Metadata(name, symbol) public {

  }

}
