import React, { useState } from "react";
import { Text, Stack, Button, Input, Box, InputGroup, InputRightElement, useToast } from '@chakra-ui/react';
import { keycloak } from './keycloak';
import AuthContext from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { client } from '@passwordless-id/webauthn';

function InputComponent() {
    const [show, setShow] = useState(false);
    const handleClick = () => setShow(!show);

    return (
        <InputGroup size='md'>
            <Input
                pr='4.5rem'
                type={show ? 'text' : 'password'}
                placeholder='Enter password'
                id="password"
                borderRadius="md"
            />
            <InputRightElement width='4.5rem'>
                <Button h='1.75rem' size='sm' onClick={handleClick}>
                    {show ? 'Hide' : 'Show'}
                </Button>
            </InputRightElement>
        </InputGroup>
    );
}

async function fetchChallenge() {
    const challengeurl = "https://kong.ztaenv.duckdns.org/fido/webauth/challenge";
    return await (await fetch(challengeurl)).text();
}

async function handleFIDORegister(username, toast, positions) {
    const challenge = await fetchChallenge();
    const registration = await client.register(username, challenge, {
        authenticatorType: "roaming",
        userVerification: "required",
        timeout: 60000,
        attestation: false,
        userHandle: "recommended to set it to a random 64 bytes value",
        debug: false
    }).catch(e => console.log(e));

    if (registration) {
        const registerurl = "https://kong.ztaenv.duckdns.org/fido/webauth/register";
        const response = await fetch(registerurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registration)
        });
        const data = await response.text();
        if (data === "帳號已註冊") {
            toast({ title: "帳號已註冊", position: positions, isClosable: true, status: 'error' });
        } else {
            const Ids = JSON.parse(data)["credential"]["id"];
            localStorage.setItem('certificate', JSON.stringify(Ids));
            toast({ title: "註冊成功", position: positions, isClosable: true, status: 'success' });
        }
    }
}

async function handleFIDOLogin(username, toast, positions, nav) {
    const IDurl = "https://kong.ztaenv.duckdns.org/fido/webauth/Id";
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    };
    let Id;
    try {
        Id = (await (await fetch(IDurl, options)).json())[0]["id"];
    } catch (e) {
        toast({ title: "帳號不存在", position: positions, isClosable: true, status: 'error' });
        return;
    }

    const challenge = await fetchChallenge();
    const authentication = await client.authenticate([Id], challenge, {
        authenticatorType: "roaming",
        userVerification: "required",
        timeout: 60000
    }).catch(e => console.log(e));

    if (authentication) {
        const loginurl = "https://kong.ztaenv.duckdns.org/fido/webauth/login";
        const response = await fetch(loginurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authentication)
        });
        const data = await response.json();
        toast({ title: "登入成功", position: positions, isClosable: true, status: 'success' });
        nav('/Home', { state: { token: data } });
    }
}

async function handleLDAPAuthentication(username, password) {
    const LDAPCheckUrl = "https://kong.ztaenv.duckdns.org/fido/ldap/login";
    const response = await fetch(LDAPCheckUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return response.json();
}

function LoginPage() {
    const toast = useToast();
    const positions = 'top-right';
    const nav = useNavigate();

    const Register = async () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const result = await handleLDAPAuthentication(username, password);
        if (result.message === "Authentication successful") {
            toast({ title: "AD 驗證成功", position: positions, isClosable: true, status: 'success' });
            handleFIDORegister(username, toast, positions);
        } else {
            toast({ title: "AD 驗證失敗", position: positions, isClosable: true, status: 'error' });
        }
    }

    const Login = async () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const result = await handleLDAPAuthentication(username, password);
        if (result.message === "Authentication successful") {
            toast({ title: "AD 驗證成功", position: positions, isClosable: true, status: 'success' });
            handleFIDOLogin(username, toast, positions, nav);
        } else {
            toast({ title: "AD 驗證失敗", position: positions, isClosable: true, status: 'error' });
        }
    }

    return (
        <Box
            background="linear-gradient(to right, #0f2027, #203a43, #2c5364)"
            align="center"
            width="100%"
            height="100vh"
            pt="9%"
            color="white"
        >
            <Text fontSize={60}>Cybersecurity R&D Lab</Text>
            <Text fontSize={40} mb={2}> ZTA PoC</Text>
            <Box width="400px">
                <Box
                    backgroundColor="white"
                    color="black"
                    align="center"
                    p="20px"
                    borderRadius="md"
                    boxShadow="xl"
                >
                    <Text fontSize={50} mb={6}>入口網站</Text>
                    <Stack spacing={4} width="100%">
                        <Text fontSize={20} align="start">FIDO 登入</Text>
                        <Input width="100%" id="username" placeholder="username" />
                        <InputComponent />
                        <Button colorScheme="blue" onClick={Register} width="100%">註冊</Button>
                        <Button colorScheme="green" onClick={Login} width="100%">登入</Button>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}

export default LoginPage;
