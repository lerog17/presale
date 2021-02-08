"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const ethereum_waffle_1 = require("ethereum-waffle");
const Denex_json_1 = __importDefault(require("../build/waffle/Denex.json"));
const Distributor_json_1 = __importDefault(require("../build/waffle/Distributor.json"));
chai_1.use(ethereum_waffle_1.solidity);
const overrides = {
    gasLimit: 100000,
};
describe("Distributor", () => {
    const [wallet, admin, treasury] = new ethereum_waffle_1.MockProvider().getWallets();
    let token;
    let distributor;
    let tokenAsTreasury;
    let distributorAsAdmin;
    const SUPPLY_AMOUNT = ethers_1.utils.parseUnits("1000000000"); // 1 bill
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        token = yield ethereum_waffle_1.deployContract(wallet, Denex_json_1.default, [
            treasury.address,
            SUPPLY_AMOUNT,
        ]);
        distributor = yield ethereum_waffle_1.deployContract(wallet, Distributor_json_1.default, [
            100,
            treasury.address,
            token.address,
            ethers_1.utils.parseUnits("1"),
            ethers_1.utils.parseUnits("10"),
            admin.address,
        ]);
        tokenAsTreasury = token.connect(treasury);
        distributorAsAdmin = distributor.connect(admin);
        yield tokenAsTreasury.transfer(distributor.address, ethers_1.utils.parseUnits("1000"));
    }));
    it("Check initial Rate", () => __awaiter(void 0, void 0, void 0, function* () {
        chai_1.expect(yield distributor.rate()).to.equal(100);
    }));
    it("Check initial cap", () => __awaiter(void 0, void 0, void 0, function* () {
        chai_1.expect(yield distributor.cap()).to.equal(ethers_1.utils.parseUnits("10"));
    }));
    it("Only owner", () => __awaiter(void 0, void 0, void 0, function* () {
        yield chai_1.expect(distributor.setRound(90, 200000)).to.be.revertedWith("DOES_NOT_HAVE_ADMIN_ROLE");
    }));
    it("Set Round", () => __awaiter(void 0, void 0, void 0, function* () {
        yield distributorAsAdmin.setRound(90, ethers_1.utils.parseUnits("1")); // raise price, add cap
        chai_1.expect(yield distributor.rate()).to.equal(90);
        chai_1.expect(yield distributor.cap()).to.equal(ethers_1.utils.parseUnits("10").add(ethers_1.utils.parseUnits("1")));
    }));
    it("Error if Paused and buying", () => __awaiter(void 0, void 0, void 0, function* () {
        yield chai_1.expect(distributor.buyTokens(wallet.address, Object.assign(Object.assign({}, overrides), { value: 100 }))).to.be.revertedWith("Crowdsale is Paused");
    }));
    it("Error if trx cap reached", () => __awaiter(void 0, void 0, void 0, function* () {
        yield distributorAsAdmin.setActivity(true);
        yield chai_1.expect(distributor.buyTokens(wallet.address, Object.assign(Object.assign({}, overrides), { value: ethers_1.utils.parseEther("10") }))).to.be.revertedWith("Exceeds transaction cap");
    }));
    it("Raises successfully by buyTokens", () => __awaiter(void 0, void 0, void 0, function* () {
        yield distributorAsAdmin.setActivity(true);
        yield distributor.buyTokens(wallet.address, {
            value: 100,
        });
        chai_1.expect(yield token.balanceOf(wallet.address)).to.equal(10000);
    }));
    it("Raises successfully by send", () => __awaiter(void 0, void 0, void 0, function* () {
        yield distributorAsAdmin.setActivity(true);
        yield wallet.sendTransaction({
            to: distributor.address,
            value: 100,
        });
        chai_1.expect(yield token.balanceOf(wallet.address)).to.equal(10000);
    }));
    it("Cap reached", () => __awaiter(void 0, void 0, void 0, function* () {
        yield distributorAsAdmin.setActivity(true);
        const capLeft = yield distributor.capLeft();
        yield distributorAsAdmin.setTransactionCap(capLeft);
        yield distributor.buyTokens(wallet.address, {
            value: capLeft,
        });
        const capReached = yield distributor.capReached();
        chai_1.expect(capReached).to.be.true;
    }));
    it("Throw error is max cap", () => __awaiter(void 0, void 0, void 0, function* () {
        yield distributorAsAdmin.setActivity(true);
        const capLeft = yield distributor.capLeft();
        yield distributorAsAdmin.setTransactionCap(capLeft);
        yield distributor.buyTokens(wallet.address, {
            value: capLeft,
        });
        yield chai_1.expect(distributor.buyTokens(wallet.address, {
            value: 1,
        })).to.be.revertedWith("Exceeds total cap");
    }));
});
