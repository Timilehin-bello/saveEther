import { expect } from "chai";
import { ethers } from "hardhat";

describe("SaveEther Contract", function () {
  let SaveEther;
  let saveEther: any;
  let owner;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    SaveEther = await ethers.getContractFactory("SaveEther");
    [owner, addr1, addr2] = await ethers.getSigners();
    saveEther = await SaveEther.deploy();
  });

  describe("Transactions", function () {
    it("Should deposit ether and emit SavingSuccessful event", async function () {
      const depositAmount = ethers.parseEther("1");
      await expect(saveEther.connect(addr1).deposit({ value: depositAmount }))
        .to.emit(saveEther, "SavingSuccessful")
        .withArgs(addr1.address, depositAmount);
      expect(await saveEther.checkSavings(addr1.address)).to.equal(
        depositAmount
      );
    });

    it("Should fail deposit with zero value", async function () {
      await expect(
        saveEther.connect(addr1).deposit({ value: 0 })
      ).to.be.revertedWith("can't save zero value");
    });

    it("Should withdraw ether", async function () {
      const depositAmount = ethers.parseEther("1");
      await saveEther.connect(addr1).deposit({ value: depositAmount });
      await expect(() =>
        saveEther.connect(addr1).withdraw()
      ).to.changeEtherBalances(
        [addr1, saveEther],
        [depositAmount, -depositAmount]
      );
    });

    it("Should fail withdraw with no savings", async function () {
      await expect(saveEther.connect(addr1).withdraw()).to.be.revertedWith(
        "you don't have any savings"
      );
    });

    it("Should send out savings", async function () {
      const depositAmount = ethers.parseEther("1");
      await saveEther.connect(addr1).deposit({ value: depositAmount });
      await expect(() =>
        saveEther.connect(addr1).sendOutSaving(addr2.address, depositAmount)
      ).to.changeEtherBalance(addr2, depositAmount);
      expect(await saveEther.checkSavings(addr1.address)).to.equal(0);
    });

    it("Should fail sendOutSaving with insufficient savings", async function () {
      const depositAmount = ethers.parseEther("1");
      await saveEther.connect(addr1).deposit({ value: depositAmount });
      await expect(
        saveEther
          .connect(addr1)
          .sendOutSaving(addr2.address, ethers.parseEther("2"))
      ).to.be.revertedWith("Insufficient savings");
    });

    it("Should fail sendOutSaving with zero value", async function () {
      await saveEther.connect(addr1).deposit({ value: ethers.parseEther("1") });
      await expect(
        saveEther.connect(addr1).sendOutSaving(addr2.address, 0)
      ).to.be.revertedWith("can't send zero value");
    });

    it("Should fail sendOutSaving to zero address", async function () {
      await saveEther.connect(addr1).deposit({ value: ethers.parseEther("1") });
      await expect(
        saveEther
          .connect(addr1)
          .sendOutSaving(ethers.ZeroAddress, ethers.parseEther("0.5"))
      ).to.be.revertedWith("no zero address call");
    });
  });

  describe("Views", function () {
    it("Should return the correct savings amount", async function () {
      const depositAmount = ethers.parseEther("1");
      await saveEther.connect(addr1).deposit({ value: depositAmount });
      expect(await saveEther.checkSavings(addr1.address)).to.equal(
        depositAmount
      );
    });

    it("Should return the correct contract balance", async function () {
      const depositAmount1 = ethers.parseEther("1");
      const depositAmount2 = ethers.parseEther("2");

      await saveEther.connect(addr1).deposit({ value: depositAmount1 });
      await saveEther.connect(addr2).deposit({ value: depositAmount2 });

      const totalDepositAmount = depositAmount1 + depositAmount2;
      expect(await saveEther.checkContractBal()).to.equal(totalDepositAmount);
    });
  });
});
