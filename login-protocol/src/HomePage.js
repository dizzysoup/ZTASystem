import React,{useState,useEffect,useContext} from "react";
import { Text,Stack,Button, useToast , Box  } from '@chakra-ui/react';
import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
  } from '@chakra-ui/react'
import {jwtDecode} from 'jwt-decode';
import { useLocation,useNavigate } from "react-router-dom";
import AuthContext from "./AuthContext";


function HomePage(){
    const toast = useToast();
    const location = useLocation();
    const positions = ['top-right']
    const [id_token ,setIdtoken]  = useState("");
    const [data , setData ] = useState(null);
    const nav = useNavigate();
    let myInterval = [];


    const ID_token = location.state == null ? null : location.state.token["id_token"];
    const refresh_token = location.state == null ? null : location.state.token["refresh_token"];

    const {account , Setaccount} = useContext(AuthContext);
    const {password , Setpassword} = useContext(AuthContext);
    
    
    useEffect(()=> {
        // 持續驗證
        if(location.state == null ){
            toast({title:"請好好用系統",position: positions, isClosable : true,status:'error'});
            nav('/');
            return () => {
                clearInterval(myInterval);
            }
        }
        myInterval = setInterval(()=>{
            introspect_Id();
        },1000)
        return () => {
            clearInterval(myInterval);
        }
        
    },[])
   
    //id token 驗證
    const introspect_Id = () => {
        // 檢查exp 效期
        const decodeData = jwtDecode(ID_token);
        const currentTimeStamp = Math.floor(Date.now() / 1000);        
        
        if(!decodeData["exp"] > currentTimeStamp){
            toast({title:"效期失效",position: positions, isClosable : true,status:'error'});
            OnHandleBtnClick_out(); // 自動登出
        }else 
            console.log("ID Token 效期內");
    }

    // 資源token 
    const OnHandleBtnClick = (param) => {
        //introspect_Id()
       /*
        const url = `https://kong.ztasecurity.duckdns.org/${param}/realms/param/protocol/openid-connect/token`
        console.log(url);        
        const formData = new URLSearchParams();
        formData.append("grant_type","password");
        formData.append("client_id",param);
        formData.append("username",account);
        formData.append("password",password);
        //formData.append("client_secret",secret);

        

        fetch(url,{
            method:"POST",
            headers : { 'Content-Type' : 'application/x-www-form-urlencoded'},
            body : formData.toString()
        }).then(res => res.json())
        .then(res => {
            if(res["error"] === "invalid_grant"){
                toast({title:"獲取失敗",position: positions, isClosable : true,status:'error'})
            }else { 
                toast({title:"獲取成功",position: positions, isClosable : true,status:'success'})
            }
        })
        .catch(e => 
            toast({title:"獲取失敗",position: positions, isClosable : true,status:'error'})
        )
        */

        const url = `https://backend.ztasecurity.duckdns.org/${param}/`
        
        const secaccess_token = 'baNOdwa9wGfw7AVRjxkFuucwcSdMnGXj';
        const requestOptions = {
            method: 'POST',
            headers : {'Content-Type':'application/json'},
            body: JSON.stringify({token:access_token})
        }
        
        // backend 
        fetch(url)
            .then(res => res.text())
            .then(res => {
                if(param == "resource2"){
                    setData(res)
                }else 
                document.body.innerHTML = res
            })
            .catch(e => console.error(e))    
        
    }

    // Leetcode Bar // 訪問資源
    const LeetcodeBarClick = () => {
        introspect_Id(); 
        
        const url = "https://kong.ztaenv.duckdns.org/fido/webauth/introspect"
        // ID token introspect
        fetch(url,{
            method:"POST",
            headers : { 'Content-Type' : 'application/json'},
            body : JSON.stringify({"token":ID_token})
        }).then(res => res.json())
        .then(res => {
            console.log(res);
            if(res == true){
               
                // 取得access token , sign 
                const sign_url = "https://kong.ztaenv.duckdns.org/keycloakserver/keycloak/sign"
                fetch(sign_url)
                .then(res => res.json())
                .then(data => {   
                    console.log(data)                                
                    nav('/LeetcodeBar',{state:{token:data}})
                })
                .catch(e => console.error(e))
               
            }
        })
        .catch(e => console.error(e))
        
    }
    // 登出
    const OnHandleBtnClick_out = () => {
        //const url = "https://kong.ztasecurity.duckdns.org/realms/react-keycloak/protocol/openid-connect/logout"
        const url = "https://kong.ztaenv.duckdns.org/fido/webauth/logout"

        fetch(url,{
            method:"POST",
            headers : { 'Content-Type' : 'application/json'},
            body : JSON.stringify({"refresh_token" : refresh_token})
        })
        .then(res => {
            console.log(res)
            toast({title:"登出成功",position: positions, isClosable : true,status:'success'});
            clearInterval(myInterval);
            nav('/');
        })
        .catch(e =>{
            console.log(e)
            toast({title:"登出失敗",position: positions, isClosable : true,status:'error'});
        }) 
    }
    return (
        <Box  backgroundColor={"blue.300"}  align={"center"} width = "100vw" h="100vh"  pt = "9%">
            <Stack width="100%" h="100%" align="center" spacing={4}>
                <Text fontSize={50}> {account} </Text>
                <Text fontSize={100}> WELCOME！ </Text>                
                <Stack direction={['column','row']} spacing='10px' >
                    <Button onClick={() => LeetcodeBarClick() }>Leetcode Bar </Button>
                    <Button  onClick={() => OnHandleBtnClick("resource2")}>獲取資源2</Button>  
                </Stack>                
                <Button onClick={OnHandleBtnClick_out}>登出</Button>  
                { data == null ? "" : 
                   <ResourceBlock content={data}/>
                }
            </Stack>
        </Box>
    );
}

function ResourceBlock(props){
    const content = JSON.parse(props.content).Mechine[0] ; 
    console.log(content);
    return (
        <TableContainer>
    <Table variant='simple'>
        <TableCaption> Resource List </TableCaption>
        <Thead>
        <Tr>
            <Th>Name </Th>
            <Th> Mechine </Th>
            <Th>created </Th>
        </Tr>
        </Thead>
        <Tbody>
        <Tr>
            <Td>{content.name}</Td>
            <Td>{content.member}</Td>
            <Td>{content.last_modify_date}</Td>
        </Tr>
        </Tbody>
        </Table>
    </TableContainer>
    );
}

export default HomePage