// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReferralRewards {
    // Token interface
    IERC20 public spectraToken;

    // Owner of the contract
    address public owner;

    // Fixed reward per referral
    uint256 public rewardPerReferral;

    // Mapping to store the number of referrals for each user
    mapping(address => uint256) public referrals;

    // Mapping to store referrer of each user
    mapping(address => address) public referrer;

    // Mapping to track if a user has already been referred
    mapping(address => bool) public referred;

    // Events
    event UserRegistered(address indexed user, address indexed referrer);
    event RewardDistributed(address indexed referrer, uint256 amount);

    // Modifier to restrict access to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // Constructor
    constructor(address _tokenAddress, uint256 _rewardPerReferral) {
        owner = msg.sender;
        spectraToken = IERC20(_tokenAddress);
        rewardPerReferral = _rewardPerReferral;
    }

    // Function to register a new user and record the referrer
    function registerUser(address _referrer) external {
        require(_referrer != msg.sender, "Cannot refer yourself");
        require(
            referrer[msg.sender] == address(0),
            "User has already been referred"
        );
        require(
            _referrer == address(0) || referred[_referrer],
            "Referrer does not exist"
        );

        if (_referrer != address(0)) {
            referrals[_referrer]++;
            referrer[msg.sender] = _referrer;
            referred[msg.sender] = true;

            // Distribute reward to the referrer
            _distributeReward(_referrer);
        }

        emit UserRegistered(msg.sender, _referrer);
    }

    // Function to distribute rewards to the referrer
    function _distributeReward(address _referrer) internal {
        uint256 reward = rewardPerReferral;
        require(
            spectraToken.transfer(_referrer, reward),
            "Reward transfer failed"
        );
        emit RewardDistributed(_referrer, reward);
    }

    // Function to change the reward per referral
    function setRewardPerReferral(uint256 _newReward) external onlyOwner {
        rewardPerReferral = _newReward;
    }

    // Function to withdraw tokens from the contract
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(spectraToken.transfer(owner, _amount), "Withdrawal failed");
    }
}

interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}
