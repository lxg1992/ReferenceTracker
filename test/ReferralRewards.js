const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReferralRewards", function () {
  let SpectraToken, spectraToken, ReferralRewards, referralRewards;
  let owner, user1, user2, user3;
  const rewardPerReferral = ethers.utils.parseUnits("10", 18); // 10 tokens

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy the mock Spectra token
    SpectraToken = await ethers.getContractFactory("ERC20Mock");
    spectraToken = await SpectraToken.deploy(
      "Spectra Token", //name
      "SPT", //symbol
      owner.address, //initialAccount
      ethers.utils.parseUnits("10000", 18) //balance 10000 * 10^18
    );
    await spectraToken.deployed();

    // Deploy the ReferralRewards contract
    ReferralRewards = await ethers.getContractFactory("ReferralRewards");
    referralRewards = await ReferralRewards.deploy(
      spectraToken.address,
      rewardPerReferral
    );
    await referralRewards.deployed();

    // Transfer some tokens to the ReferralRewards contract
    await spectraToken.transfer(
      referralRewards.address,
      ethers.utils.parseUnits("1000", 18)
    );
  });

  it("should register a user with a referrer", async function () {
    await referralRewards.connect(user1).registerUser(owner.address);

    const referrer = await referralRewards.referrer(user1.address);

    const referrals = await referralRewards.referrals(owner.address);

    expect(referrer).to.equal(owner.address);
    expect(referrals).to.equal(1);
  });

  it("should not allow a user to refer themselves", async function () {
    await expect(
      referralRewards.connect(user1).registerUser(user1.address)
    ).to.be.revertedWith("Cannot refer yourself");
  });

  it("should not allow a user to be referred more than once", async function () {
    await referralRewards.connect(user1).registerUser(owner.address);
    await expect(
      referralRewards.connect(user1).registerUser(owner.address)
    ).to.be.revertedWith("User has already been referred");
  });

  it("should distribute rewards to the referrer", async function () {
    const initialBalance = await spectraToken.balanceOf(owner.address);

    await referralRewards.connect(user1).registerUser(owner.address);
    const finalBalance = await spectraToken.balanceOf(owner.address);

    expect(finalBalance.sub(initialBalance)).to.equal(rewardPerReferral);
  });

  it("should allow the owner to change the reward per referral", async function () {
    const newReward = ethers.utils.parseUnits("20", 18); // 20 tokens
    await referralRewards.setRewardPerReferral(newReward);
    const reward = await referralRewards.rewardPerReferral();

    expect(reward).to.equal(newReward);
  });

  it("should allow the owner to withdraw tokens", async function () {
    const withdrawAmount = ethers.utils.parseUnits("100", 18);
    const initialBalance = await spectraToken.balanceOf(owner.address);

    await referralRewards.withdrawTokens(withdrawAmount);
    const finalBalance = await spectraToken.balanceOf(owner.address);

    expect(finalBalance.sub(initialBalance)).to.equal(withdrawAmount);
  });

  it("should restrict reward setting to the owner", async function () {
    const newReward = ethers.utils.parseUnits("20", 18); // 20 tokens
    await expect(
      referralRewards.connect(user1).setRewardPerReferral(newReward)
    ).to.be.revertedWith("Caller is not the owner");
  });

  it("should restrict token withdrawal to the owner", async function () {
    const withdrawAmount = ethers.utils.parseUnits("100", 18);
    await expect(
      referralRewards.connect(user1).withdrawTokens(withdrawAmount)
    ).to.be.revertedWith("Caller is not the owner");
  });
});
