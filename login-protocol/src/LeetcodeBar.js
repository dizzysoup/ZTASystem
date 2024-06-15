import { useEffect, useState } from "react";
import { Progress, Button, Box, Heading, Text , Stack ,Flex, useToast } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";

function PointsBlock(keys){
  const point = keys.item.points;
  return (
    <Flex
      position="relative"
      backgroundColor="gray.300"
      w="850px"
      h="auto"
      p="2%"
      justify="center"
      alignItems="center" // 让子元素垂直居中
    >
      <Text fontSize="lg">{keys.item.user.username}</Text>
      <Progress ml="2%" value={point} max={100} w="450px" />
      <Text ml="2%" fontSize={20} align="left">
        {point} / 100
      </Text>
      <Box
        position="absolute"
        bottom={0}
        right={830}
        width={0}
        height={0}
        borderStyle="solid"
        borderWidth="0 20px 20px 0"
        borderColor="transparent transparent orange transparent"
      />
    </Flex>
  );
}

function LeetcodeBar() {
  const [UserData , setUserData] = useState([]); // Set initial user data to an empty array [
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const access_token = location.state == null ? null : location.state.token["access_token"];
  const sign = location.state == null ? null : location.state.token["sign"];
  console.log(access_token);
  useEffect(() => {
    

    if(location.state == null){
      toast({title:"請好好用系統",position:  ['top-right'], isClosable : true,status:'error'});
      nav('/');
      return ; 
    }

    // verify token (驗簽)
    const verifytoken = "https://source.ztaenv.duckdns.org/leetcodebar/verify/"
    fetch(verifytoken , {
      method : "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body : JSON.stringify({access_token : access_token, sign : sign})
    }).then((res) => res.json()).then((data) => {
      if(data["Error"] != null)    {
        toast({title:data["Error"],position:  ['top-right'], isClosable : true,status:'error'});
        nav('/');
      }else 
        toast({title:"驗簽成功",position:  ['top-right'], isClosable : true,status:'success'});
        const sourceurl = "https://source.ztaenv.duckdns.org/leetcodebar/score/"
        fetch(sourceurl).then((res) => res.json())
            .then((data) => {
              setUserData(data["Scores"]);
            });
    }).catch((error) => { console.error(error);});

    
  }, []);
  console.log(UserData)
  return (
    <Box  backgroundColor={"gray.400"}  align={"center"} width = "100vw" h="100vh"  pt = "4%">
      <Heading mb={4}>Leetcode 進度表</Heading>      
        <Box align="left" ml = "5%">
        <Stack width="100%" h="100%" align={"center"} spacing={2} alignContent={"center"}>
          { Array.isArray(UserData) && UserData.length > 0 ?  UserData.map((item , index) => (
            <PointsBlock key = {index} item={item}/>
          )) : <Text> Loading... </Text> }            
        </Stack>
        </Box>
      <Heading mt={"5%"}> 本賽季題目挑戰 </Heading>
    </Box>
  );
}

export default LeetcodeBar;