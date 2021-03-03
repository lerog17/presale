import { expect, use } from "chai";
import { Contract, utils } from "ethers";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import Denex from "../build/waffle/Denex.json";
import Distributor from "../build/waffle/Distributor.json";

use(solidity);

const overrides = {
  gasLimit: 100000,
};

describe.only("Distributor", () => {
  const [deployer, treasury, user] = new MockProvider().getWallets();

  let token: Contract;
  let distributor: Contract;
  let tokenAsTreasury: Contract;
  let distributorAsAdmin: Contract;

  const SUPPLY_AMOUNT = utils.parseUnits("1000000000"); // 1 bill

  beforeEach(async () => {
    token = await deployContract(deployer, Denex, [
      treasury.address,
      SUPPLY_AMOUNT,
    ]);
    distributor = await deployContract(deployer, Distributor, [
      100,
      treasury.address,
      token.address,
      utils.parseUnits("1"), // trx cap
      utils.parseUnits("10"), // total cap
      deployer.address,
    ]);
    tokenAsTreasury = token.connect(treasury);
    tokenAsTreasury.approve(distributor.address, utils.parseUnits("10000000"));
    distributorAsAdmin = distributor.connect(deployer);
  });

  it("Check initial Rate", async () => {
    expect(await distributor.rate()).to.equal(100);
  });

  it("Check initial cap", async () => {
    expect(await distributor.cap()).to.equal(utils.parseUnits("10"));
  });

  it("Only owner", async () => {
    const distributorAsUser = distributor.connect(user);
    await expect(distributorAsUser.setRound(90, 200000)).to.be.revertedWith(
      "DOES_NOT_HAVE_ADMIN_ROLE"
    );
  });

  it("Set Round", async () => {
    await distributorAsAdmin.setRound(90, utils.parseUnits("1")); // raise price, add cap
    expect(await distributor.rate()).to.equal(90);
    expect(await distributor.cap()).to.equal(
      utils.parseUnits("10").add(utils.parseUnits("1"))
    );
  });

  it("Error if Paused and buying", async () => {
    await expect(
      distributor.buyTokens(user.address, {
        ...overrides,
        value: 100,
      })
    ).to.be.revertedWith("Crowdsale is Paused");
  });

  it("Error if trx cap reached", async () => {
    await distributorAsAdmin.setActivity(true);
    await expect(
      distributor.buyTokens(user.address, {
        ...overrides,
        value: utils.parseEther("10"),
      })
    ).to.be.revertedWith("Exceeds transaction cap");
  });

  it("Raises successfully by buyTokens", async () => {
    await distributorAsAdmin.setActivity(true);
    await distributor.buyTokens(user.address, {
      value: 100,
    });

    expect(await token.balanceOf(user.address)).to.equal(10000);
  });

  it("Raises successfully by send", async () => {
    await distributorAsAdmin.setActivity(true);
    await user.sendTransaction({
      to: distributor.address,
      value: 100,
    });

    expect(await token.balanceOf(user.address)).to.equal(10000);
  });

  it("Cap reached", async () => {
    await distributorAsAdmin.setActivity(true);
    const capLeft = await distributor.capLeft();
    await distributorAsAdmin.setTransactionCap(capLeft);
    await distributor.buyTokens(user.address, {
      value: capLeft, // buy all tokens
    });
    const capReached = await distributor.capReached();

    expect(capReached).to.be.true;
  });

  it("Throw error is max cap", async () => {
    await distributorAsAdmin.setActivity(true);
    const capLeft = await distributor.capLeft();
    await distributorAsAdmin.setTransactionCap(capLeft);
    await distributor.buyTokens(user.address, {
      value: capLeft,
    });

    await expect(
      distributor.buyTokens(user.address, {
        value: 1,
      })
    ).to.be.revertedWith("Exceeds total cap");
  });
});
