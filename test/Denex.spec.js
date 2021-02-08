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
const ethereum_waffle_1 = require("ethereum-waffle");
const Denex_json_1 = __importDefault(require("../build/waffle/Denex.json"));
console.log("running test");
chai_1.use(ethereum_waffle_1.solidity);
describe("Denex", () => {
    const [wallet, walletTo, treasury] = new ethereum_waffle_1.MockProvider().getWallets();
    let token;
    let treasurySignedContract;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        token = yield ethereum_waffle_1.deployContract(wallet, Denex_json_1.default, [treasury.address, 1000]);
        treasurySignedContract = token.connect(treasury);
    }));
    it("Assigns initial balance", () => __awaiter(void 0, void 0, void 0, function* () {
        chai_1.expect(yield token.balanceOf(treasury.address)).to.equal(1000);
    }));
    it("Transfer adds amount to destination account", () => __awaiter(void 0, void 0, void 0, function* () {
        yield treasurySignedContract.transfer(walletTo.address, 7);
        chai_1.expect(yield token.balanceOf(walletTo.address)).to.equal(7);
    }));
    it("Transfer emits event", () => __awaiter(void 0, void 0, void 0, function* () {
        yield chai_1.expect(treasurySignedContract.transfer(walletTo.address, 7))
            .to.emit(token, "Transfer")
            .withArgs(treasury.address, walletTo.address, 7);
    }));
    it("Can not transfer above the amount", () => __awaiter(void 0, void 0, void 0, function* () {
        yield chai_1.expect(token.transfer(walletTo.address, 1007)).to.be.reverted;
    }));
    it("Can not transfer from empty account", () => __awaiter(void 0, void 0, void 0, function* () {
        const tokenFromOtherWallet = token.connect(walletTo);
        yield chai_1.expect(tokenFromOtherWallet.transfer(wallet.address, 1)).to.be
            .reverted;
    }));
    it("Calls totalSupply on BasicToken contract", () => __awaiter(void 0, void 0, void 0, function* () {
        yield token.totalSupply();
        chai_1.expect("totalSupply").to.be.calledOnContract(token);
    }));
    it("Calls balanceOf with sender address on BasicToken contract", () => __awaiter(void 0, void 0, void 0, function* () {
        yield token.balanceOf(wallet.address);
        chai_1.expect("balanceOf").to.be.calledOnContractWith(token, [wallet.address]);
    }));
});
