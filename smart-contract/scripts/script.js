const hre = require("hardhat");

async function main() {
  const galleryFactory = await hre.ethers.getContractFactory("Gallery");
  const galleryContract = await galleryFactory.deploy();
  await galleryContract.deployed();

  console.log("galleryContract deployed to:", galleryContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
