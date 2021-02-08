import { expect, use } from "chai";
import { Contract } from "ethers";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import Denex from "../build/waffle/Denex.json";

console.log("running test");
use(solidity);

describe("Denex", () => {
  const [wallet, walletTo, treasury] = new MockProvider().getWallets();

  let token: Contract;
  let treasurySignedContract: Contract;

  beforeEach(async () => {
    token = await deployContract(wallet, Denex, [treasury.address, 1000]);
    treasurySignedContract = token.connect(treasury);
  });

  it("Assigns initial balance", async () => {
    expect(await token.balanceOf(treasury.address)).to.equal(1000);
  });

  it("Transfer adds amount to destination account", async () => {
    await treasurySignedContract.transfer(walletTo.address, 7);
    expect(await token.balanceOf(walletTo.address)).to.equal(7);
  });

  it("Transfer emits event", async () => {
    await expect(treasurySignedContract.transfer(walletTo.address, 7))
      .to.emit(token, "Transfer")
      .withArgs(treasury.address, walletTo.address, 7);
  });

  it("Can not transfer above the amount", async () => {
    await expect(token.transfer(walletTo.address, 1007)).to.be.reverted;
  });

  it("Can not transfer from empty account", async () => {
    const tokenFromOtherWallet = token.connect(walletTo);
    await expect(tokenFromOtherWallet.transfer(wallet.address, 1)).to.be
      .reverted;
  });

  it("Calls totalSupply on BasicToken contract", async () => {
    await token.totalSupply();
    expect("totalSupply").to.be.calledOnContract(token);
  });

  it("Calls balanceOf with sender address on BasicToken contract", async () => {
    await token.balanceOf(wallet.address);
    expect("balanceOf").to.be.calledOnContractWith(token, [wallet.address]);
  });
});
